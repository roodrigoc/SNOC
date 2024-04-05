/* Copyright (C) 2024 Rodrigo Costa (roodrigoc@hotmail.com)

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the
Free Software Foundation; either version 3, or (at your option) any
later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; see the file COPYING. If not, see
<http://www.gnu.org/licenses/>.  */

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const ping = require('ping');
const axios = require('axios');
const { exec } = require('child_process');
const nodemailer = require('nodemailer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { decodeBase64 } = require('base64-arraybuffer');

const app = express();
app.use(express.urlencoded({ extended: true }));
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const changePassword = require('./changePassword'); // Importando a função de alteração de senha

const auth = require('basic-auth');

//Rate limiting prevents the same IP address from making too many requests that will help us prevent attacks like brute force
const limiter = rateLimit({
	windowMs: 60 * 60 * 1000,
	max: 2000, 
	message: "You have reached the request limit, please try again in 1 hour."
	
});

function basicAuth(req, res, next) {
    const credentials = auth(req);

    if (!credentials || !credentials.name) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="SNOC"');
	res.setHeader('Cache-Control', 'no-store');
        res.end('Access denied.');
        return;
    }

    const usersData = fs.readFileSync('users.conf', 'utf8').split('\n');
    const validUsers = usersData.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [username, password] = trimmedLine.split(':');
            return { username, password: Buffer.from(password, 'base64').toString('utf-8') };
        }
        return null;
    }).filter(user => user !== null);

    const isValidUser = validUsers.some(user => user.username === credentials.name && user.password === credentials.pass);

    if (!isValidUser) {
        res.statusCode = 401;
        res.setHeader('WWW-Authenticate', 'Basic realm="SNOC"');
	res.setHeader('Cache-Control', 'no-store');
        res.end('Access denied.');
    } else {
        next();
    }
}

const configData = fs.readFileSync('snoc.conf', 'utf8');
const config = {};
const emailGroups = {};
configData.split('\n').forEach(line => {
    if (line.trim() && !line.trim().startsWith('#')) {
        const [key, value] = line.split('=');
        if (key.trim().startsWith('E')) {
            const groupName = key.trim();
            const emails = value.trim().split(';');
            emailGroups[groupName] = emails;
        } else {
            config[key.trim()] = value.trim();
        }
    }
});


const transporter = nodemailer.createTransport({
    host: config['smtp-host'],
    port: parseInt(config['smtp-port']),
    secure: parseInt(config['smtp-secure']), 
    auth: {
        user: config['smtp-user'],
        pass: Buffer.from(config['smtp-password'], 'base64').toString('utf-8')
    },
    tls: {
        rejectUnauthorized: true 
    }
});

app.use(limiter);
app.use(basicAuth);
app.use(express.static('public'));


const changePasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: "Too many requests for password change, please try again later."
});

app.post('/change-password', changePasswordLimiter, (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    const usersData = fs.readFileSync('users.conf', 'utf8').split('\n');
    let userFound = false;
    const updatedUsersData = usersData.map(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            const [existingUsername, password] = trimmedLine.split(':');
            if (existingUsername === username) {
                const decodedPassword = Buffer.from(password, 'base64').toString('utf-8');
                if (decodedPassword === currentPassword) {
                    userFound = true;
                    const newEncodedPassword = Buffer.from(newPassword).toString('base64');
                    return `${existingUsername}:${newEncodedPassword}`;
                }
            }
        }
        return line;
    });
    if (userFound) {
        fs.writeFileSync('users.conf', updatedUsersData.join('\n'));
        res.send('Password changed successfully.');
    } else {
        res.redirect('/change-password.html?error=invalid');
    }
});


const accumulatedStatusTimes = {};


function readDevices() {
    const devices = [];
    const configData = fs.readFileSync('snoc.conf', 'utf8');
    const config = {};
    configData.split('\n').forEach(line => {
        if (line.trim() && !line.trim().startsWith('#')) {
            const [key, value] = line.split('=');
            config[key.trim()] = value.trim();
        }
    });

    const groups = Object.keys(config).filter(key => key !== 'smtp-host' && key !== 'smtp-port' && key !== 'smtp-secure' && key !== 'smtp-user' && key !== 'smtp-password');
    console.log('Email Groups:', groups);

    const data = fs.readFileSync('devices.conf', 'utf8');
    const lines = data.split('\n');
    lines.forEach(line => {
        if (line.trim() && !line.trim().startsWith('#')) {
            const [device, address, protocol, permission, visibility] = line.trim().split('|');
            if (permission !== 'NE' && !groups.includes(permission)) {
                console.error(`Error: Permission group "${permission}" does not exist in snoc.conf`);
                return;
            }
            devices.push({ device, address, protocol, permission, visibility });
            accumulatedStatusTimes[address] = accumulatedStatusTimes[address] || { online: 0, offline: 0 };
        }
    });
    return devices;
}


async function checkDeviceStatus(devices) {
    const status = await Promise.all(devices.map(async ({ device, address, protocol, permission }) => {
        try {
            let res;
            if (protocol.toLowerCase() === 'icmp') {
		//res = await ping.promise.probe(address, { min_reply: 1, interval: 10000 });
		res = await ping.promise.probe(address, { timeout: 2, min_reply: 2 });
            } else if (protocol.toLowerCase() === 'web') {
                //res = await axios.get(address, { timeout: 10000 });
		res = await axios.get(address);
            } else {
                throw new Error(`Protocol or Service ${protocol} not supported`);
            }

            const currentTime = new Date();
            const accumulatedTime = accumulatedStatusTimes[address];
            if ((res.status === 200 && protocol.toLowerCase() === 'web') || res.alive) {
                if (accumulatedTime.lastStatus === 'offline') {
                    accumulatedTime.offline = 0;
                    sendEmail(device, address, 'online', permission);

                }
                accumulatedTime.online += (currentTime - (accumulatedTime.lastUpdateTime || currentTime));
                accumulatedTime.lastUpdateTime = currentTime;
                accumulatedTime.lastStatus = 'online';
            } else {
                if (accumulatedTime.lastStatus === 'online') {
                    accumulatedTime.online = 0;
                    accumulatedTime.lastOfflineTime = currentTime;
                    sendEmail(device, address, 'offline', permission);

                }
                accumulatedTime.offline += (currentTime - (accumulatedTime.lastUpdateTime || currentTime));
                accumulatedTime.lastUpdateTime = currentTime;
                accumulatedTime.lastStatus = 'offline';
            }
            return { device, address, isOnline: res.alive || (res.status === 200 && protocol.toLowerCase() === 'web') };
			
        } catch (error) {
            console.error(`Error checking device ${device} (${address}): ${error.message}`);
            const currentTime = new Date();
            const accumulatedTime = accumulatedStatusTimes[address];
            if (accumulatedTime.lastStatus === 'online') {
                accumulatedTime.online = 0;
                accumulatedTime.lastOfflineTime = currentTime;
                sendEmail(device, address, 'offline', permission);

            }
            accumulatedTime.offline += (currentTime - (accumulatedTime.lastUpdateTime || currentTime));
            accumulatedTime.lastUpdateTime = currentTime;
            accumulatedTime.lastStatus = 'offline';
            return { device, address, isOnline: false };
        }
    }));
    return status;
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}

function sendEmailToGroup(groupName, device, address, status) {
    const subject = `Alert! Device "${device}" is ${status}`;
    const currentTime = new Date().toLocaleString();
    const content = `Date/Time: ${currentTime}\nDevice Address: ${address}`;
    const mailOptions = {
        from: config['smtp-user'],
        to: emailGroups[groupName].join(';'),
        subject: subject,
        text: content
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

function sendEmail(device, address, status, permission) {
    if (permission.startsWith('E')) {
        const groupName = permission;
        sendEmailToGroup(groupName, device, address, status);
    }
}

function logConnection(ip, username) {
    const currentTime = new Date();
    const brazilTime = new Date(currentTime.getTime() - (3 * 60 * 60 * 1000)); 
    const brazilTimeFormatted = brazilTime.toISOString().replace('Z', ''); 

    const logMessage = `[${brazilTimeFormatted}] Connection from ${ip} (User: ${username})\n`;
    fs.appendFile('access.log', logMessage, (err) => {
        if (err) {
            console.error('Error registering connection:', err);
        }
    });
    console.log(`Connection from ${ip} (User: ${username})`);
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

wss.on('connection', (ws, req) => {
    const ip = req.connection.remoteAddress;
    const credentials = auth(req);
    const username = credentials ? credentials.name.toLowerCase() : 'unknown';
	
    logConnection(ip, username);

    const devices = readDevices();
    updateDeviceStatus(ws, devices);

    const interval = setInterval(() => {
        updateDeviceStatus(ws, devices);
    //}, 10000);
    }, 5000);

    ws.on('close', () => {
        console.log('Client disconnected');
        clearInterval(interval);
    });
});

async function updateDeviceStatus(ws, devices) {
    try {
        const status = await checkDeviceStatus(devices);
        const statusWithAccumulatedTime = status.map(({ device, address, isOnline }) => {
            const accumulatedTime = accumulatedStatusTimes[address];
            return {
                device,
                address,
                status: isOnline ? 'online' : 'offline',
                time: isOnline ? formatTime(accumulatedTime.online) : formatTime(accumulatedTime.offline)
            };
        });
        const visibleDevices = statusWithAccumulatedTime.filter(device => devices.find(d => d.device === device.device && d.visibility === 'show'));
        ws.send(JSON.stringify(visibleDevices));
    } catch (error) {
        console.error('Error updating device statuses:', error.message);
    }
}

//enter network share path here
const pastaCompartilhada = '\\\\192.168.100.50\\tmp'; 

app.get('/ultimo-arquivo', (req, res) => {

    const pastaAtual = pastaCompartilhada;

    fs.readdir(pastaAtual, (err, files) => {
        if (err) {
            res.send(`The folder (${pastaAtual}) don't exist.`);
        } else {
            if (files.length === 0) {
                res.send(`The folder (${pastaAtual}) is empty.`);
            } else {
                files = files.filter(file => {
			const lowercaseFile = file.toLowerCase();
			return lowercaseFile.endsWith('.wav') || lowercaseFile.endsWith('.mp3');
		});
                if (files.length === 0) {
                    res.send(`The folder (${pastaAtual}) don't contain audio files.`);
                } else {
                    files.sort((a, b) => {
                        const statA = fs.statSync(path.join(pastaAtual, a));
                        const statB = fs.statSync(path.join(pastaAtual, b));
                        return statB.birthtime.getTime() - statA.birthtime.getTime();
                    });

                    const ultimoArquivo = files[0]; 
                    const caminhoCompleto = path.join(pastaAtual, ultimoArquivo);
                    res.send(caminhoCompleto);
                }
            }
        }
    });
});

const caminhoDevicesJS = path.join(__dirname, 'devices.js');

app.get('/devices.js', (req, res) => {
    res.sendFile(caminhoDevicesJS);
});

app.post('/change-password', changePassword.changePassword);

server.listen(3000, () => {
    console.log('Server started at: http://localhost:3000');
});
