const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuração do CORS (opcional)
app.use(cors());

// Exemplo de rota HTTP
app.get('/', (req, res) => {
  res.send('Servidor WebSocket funcionando');
});

// Função para lidar com novas conexões WebSocket
wss.on('connection', (ws) => {
  console.log('Novo cliente conectado');

  ws.on('message', (message) => {
    console.log('Recebido:', message);

    // Aqui você pode lidar com as mensagens recebidas do cliente
    ws.send('Mensagem recebida pelo servidor');
  });

  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

// Iniciar o servidor
server.listen(8080, () => {
  console.log('Servidor rodando na porta 8080');
});
