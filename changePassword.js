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

const fs = require('fs');

function changePassword(req, res) {
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
}

module.exports = changePassword;
