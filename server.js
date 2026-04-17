const WebSocket = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Vision Swap Signaling Server');
});

const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }

    if (msg.type === 'join') {
      currentRoom = msg.room;
      if (!rooms[currentRoom]) rooms[currentRoom] = [];
      rooms[currentRoom].push(ws);

      const others = rooms[currentRoom].filter(c => c !== ws);
      others.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
          c.send(JSON.stringify({ type: 'peer-joined' }));
        }
      });
      return;
    }

    if (currentRoom && rooms[currentRoom]) {
      const others = rooms[currentRoom].filter(c => c !== ws);
      others.forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
          c.send(JSON.stringify(msg));
        }
      });
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom] = rooms[currentRoom].filter(c => c !== ws);
      rooms[currentRoom].forEach(c => {
        if (c.readyState === WebSocket.OPEN) {
          c.send(JSON.stringify({ type: 'peer-left' }));
        }
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});