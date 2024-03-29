//Enter the sharing path with audio files here
const pastaCompartilhada = '\\\\192.168.21.12\\tmp'; 

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