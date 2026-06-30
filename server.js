const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let messages = [];
let users = {};

if (fs.existsSync('messages.json')) {
  try {
    messages = JSON.parse(fs.readFileSync('messages.json'));
  } catch(e) {}
}

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  socket.on('register', (name) => {
    users[socket.id] = name;
    socket.emit('history', messages);
    io.emit('users', Object.values(users));
  });

  socket.on('message', (data) => {
    const msg = {
      id: Date.now(),
      from: users[socket.id] || 'Аноним',
      to: data.to || 'all',
      text: data.text,
      time: new Date().toLocaleTimeString()
    };
    messages.push(msg);
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));
    io.emit('message', msg);
  });

  socket.on('call', (data) => {
    socket.to(data.to).emit('call', {
      from: users[socket.id],
      signal: data.signal
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer', {
      from: users[socket.id],
      signal: data.signal
    });
  });

  socket.on('disconnect', () => {
    const name = users[socket.id];
    delete users[socket.id];
    io.emit('users', Object.values(users));
    console.log('Пользователь отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
