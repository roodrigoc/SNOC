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

	// Enter the server IP here:    
        const ws = new WebSocket('ws://192.168.100.5:3000');

        ws.onmessage = function(event) {
            const devices = JSON.parse(event.data);
            const devicesDiv = document.getElementById('devices');
            devicesDiv.innerHTML = '';

            devices.forEach(device => {
                const deviceDiv = document.createElement('div');
                deviceDiv.className = `device ${device.status === 'offline' ? 'offline' : ''}`;
                deviceDiv.innerHTML = `
                    <h2>${device.device}</h2>
                    <p>IP, Host ou Domínio: ${device.address}</p>
                    <p>Status: ${device.status.toUpperCase()}</p>
                    <p>Tempo ${device.status === 'online' ? 'ativo' : 'inativo'}: ${device.time}</p>
                `;
                devicesDiv.appendChild(deviceDiv);
            });

        };
		
		function atualizarUltimoArquivo() {
            fetch('/ultimo-arquivo')
                .then(response => response.text())
                .then(audioPath => {
                	document.getElementById('ultimo-arquivo').style.fontSize = '40px'; 
			document.getElementById('ultimo-arquivo').innerText = `Last audio file: ${audioPath}`;
                })
                .catch(error => {
                    console.error('Error getting last audio file:', error);
                });
        }

        
        setInterval(atualizarUltimoArquivo, 15000);

        
        atualizarUltimoArquivo();
