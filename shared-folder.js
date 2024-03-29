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

//Enter the sharing path with audio files here
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
