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

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const configData = fs.readFileSync('snoc.conf', 'utf8');
const config = {};
configData.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    config[key.trim()] = value.trim();
});


const transporter = nodemailer.createTransport({
    host: config['smtp-host'],
    port: parseInt(config['smtp-port']),
    secure: false, 
    auth: {
        user: config['smtp-user'],
        pass: 'xyzabcdefghijklm' 
    },
    tls: {
        rejectUnauthorized: true 
    }
});



app.use(express.static('public'));


const accumulatedStatusTimes = {};


function readDevices() {
    const devices = [];
    const data = fs.readFileSync('devices.conf', 'utf8');
    const lines = data.split('\n');
    lines.forEach(line => {
        const [device, address, protocol, permission] = line.trim().split('|');
        devices.push({ device, address, protocol, permission });
        
        accumulatedStatusTimes[address] = { online: 0, offline: 0 };
    });
    return devices;
}


async function checkDeviceStatus(devices) {
    const status = await Promise.all(devices.map(async ({ device, address, protocol, permission }) => {
        try {
            let res;
            if (protocol.toLowerCase() === 'icmp') {
				res = await ping.promise.probe(address, { timeout: 2, min_reply: 2 });
            } else if (protocol.toLowerCase() === 'web') {
                res = await axios.get(address);
            } else {
                throw new Error(`Protocolo ou Serviço ${protocol} não suportado`);
            }

            const currentTime = new Date();
            const accumulatedTime = accumulatedStatusTimes[address];
            if ((res.status === 200 && protocol.toLowerCase() === 'web') || res.alive) {
                if (accumulatedTime.lastStatus === 'offline') {
                    accumulatedTime.offline = 0;
                    if (permission === 'E') {
                        sendEmail(device, address, 'online');
                    }
                }
                accumulatedTime.online += (currentTime - (accumulatedTime.lastUpdateTime || currentTime));
                accumulatedTime.lastUpdateTime = currentTime;
                accumulatedTime.lastStatus = 'online';
            } else {
                if (accumulatedTime.lastStatus === 'online') {
                    accumulatedTime.online = 0;
                    accumulatedTime.lastOfflineTime = currentTime;
                    if (permission === 'E') {
                        sendEmail(device, address, 'offline');
                    }
                }
                accumulatedTime.offline += (currentTime - (accumulatedTime.lastUpdateTime || currentTime));
                accumulatedTime.lastUpdateTime = currentTime;
                accumulatedTime.lastStatus = 'offline';
            }
            return { device, address, isOnline: res.alive || (res.status === 200 && protocol.toLowerCase() === 'web') };
			
        } catch (error) {
            console.error(`Erro ao verificar o dispositivo ${device} (${address}): ${error.message}`);
            const currentTime = new Date();
            const accumulatedTime = accumulatedStatusTimes[address];
            if (accumulatedTime.lastStatus === 'online') {
                accumulatedTime.online = 0;
                accumulatedTime.lastOfflineTime = currentTime;
                if (permission === 'E') {
                    sendEmail(device, address, 'offline');
                }
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

function sendEmail(device, address, status) {
    const subject = `Alerta! Dispositivo "${device}" está ${status}`;
    const currentTime = new Date().toLocaleString();
    const content = `Data/Horário da ocorrência: ${currentTime}\nEndereço do dispositivo: ${address}`;
    const mailOptions = {
        from: config['smtp-user'],
        to: config['email-destino'],
        subject: subject,
        text: content
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Erro ao enviar e-mail:', error);
        } else {
            console.log('E-mail enviado:', info.response);
        }
    });
}

function logConnection(ip) {
    const currentTime = new Date();
    const brazilTime = new Date(currentTime.getTime() - (3 * 60 * 60 * 1000)); 
    const brazilTimeFormatted = brazilTime.toISOString().replace('Z', ''); 

    const logMessage = `[${brazilTimeFormatted}] Conexão de ${ip}\n`;
    fs.appendFile('access.log', logMessage, (err) => {
        if (err) {
            console.error('Erro ao registrar a conexão:', err);
        }
    });
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

wss.on('connection', (ws, req) => {
    const ip = req.connection.remoteAddress;
    console.log('Cliente conectado do IP:', ip);

    logConnection(ip);

    const devices = readDevices();
    updateDeviceStatus(ws, devices);

    const interval = setInterval(() => {
        updateDeviceStatus(ws, devices);
    }, 5000);

    ws.on('close', () => {
        console.log('Cliente desconectado');
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
        ws.send(JSON.stringify(statusWithAccumulatedTime));
    } catch (error) {
        console.error('Erro ao atualizar status dos dispositivos:', error.message);
    }
}

const pastaCompartilhada = '\\\\192.168.1.100\\tmp'; 

app.get('/ultimo-arquivo', (req, res) => {

    const pastaAtual = pastaCompartilhada;

    fs.readdir(pastaAtual, (err, files) => {
        if (err) {
            res.send(`A pasta (${pastaAtual}) não existe.`);
        } else {
            if (files.length === 0) {
                res.send(`A pasta (${pastaAtual}) está vazia.`);
            } else {
                files = files.filter(file => file.endsWith('.WAV')); 
                if (files.length === 0) {
                    res.send(`A pasta  (${pastaAtual}) não contém arquivos de áudio.`);
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


server.listen(3000, () => {
    console.log('Servidor iniciado em http://localhost:3000');
});
