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

module.exports = {
    changePassword
};