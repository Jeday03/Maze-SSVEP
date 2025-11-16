const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ENABLE_BCI = process.argv.includes('--bci');
console.log("[SERVER] BCI habilitado? ", ENABLE_BCI);

const server = http.createServer((req, res) => {
  if (req.url === '/cfg.json') {
    const ENABLE_BCI = process.argv.includes('--bci');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      bci: ENABLE_BCI,
      bciWsUrl: 'ws://localhost:8767'
    }));
    return; // <<< ESSENCIAL para não cair no fs.readFile abaixo
  }

  // Roteamento de arquivos estáticos
  let filePath = '.' + req.url;
  if (filePath === './') filePath = './main.html';

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = {
    '.html': 'text/html',
    '.js':   'text/javascript',
    '.css':  'text/css',
  }[extname] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf-8');
  });
});


// Configura o servidor WebSocket
const wss = new WebSocket.Server({ port: 8765 });

wss.on('connection', function connection(ws) {
    console.log('Client connected via WebSocket');

    ws.on('message', function incoming(data) {
        const signal = JSON.parse(data)
        console.log('Received matrix from Python server:', signal);
        // Aqui você pode adicionar o código para processar a matriz recebida
    });

    ws.on('close', function close() {
        console.log('Client disconnected');
    });
});

if (require.main === module) {
  const PORT = 3000;
  if (!server.listening) {
    server.listen(PORT, () => {
      console.log(`HTTP rodando em http://localhost:${PORT}/`);
    });
  }
}

module.exports = server;