const express = require('express');
const fs = require('fs');
const WebSocket = require('ws');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const server = app.listen(port, '0.0.0.0', () => console.log(`Servidor a correr em http://localhost:${port}`));
const wss = new WebSocket.Server({ server });

wss.broadcast = function(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

// Inicializar pontuações
if (!fs.existsSync('pontuacoes.json')) {
    fs.writeFileSync('pontuacoes.json', JSON.stringify({ jogadorA: 0, jogadorB: 0 }));
}

app.get('/pontuacoes', (req, res) => {
    fs.readFile('pontuacoes.json', (err, data) => {
        if (err) return res.status(500).json({ erro: 'Erro ao ler pontuações' });
        res.json(JSON.parse(data));
    });
});

app.post('/update', (req, res) => {
    fs.readFile('pontuacoes.json', (err, data) => {
        if (err) return res.status(500).json({ erro: 'Erro ao ler pontuações' });

        let pontuacoes = JSON.parse(data);
        if (req.body.player === 'A') {
            pontuacoes.jogadorA = req.body.score;
        } else if (req.body.player === 'B') {
            pontuacoes.jogadorB = req.body.score;
        }

        fs.writeFile('pontuacoes.json', JSON.stringify(pontuacoes), (err) => {
            if (err) return res.status(500).json({ erro: 'Erro ao salvar pontuações' });
            wss.broadcast(pontuacoes);
            res.json({ sucesso: true });
        });
    });
});
