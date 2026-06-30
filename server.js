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

// Хранилище
let messages = [];
let users = {};

// Загрузка истории
if (fs.existsSync('messages.json')) {
  try {
    messages = JSON.parse(fs.readFileSync('messages.json'));
  } catch(e) {}
}

io.on('connection', (socket) => {
  console.log('✅ Подключился:', socket.id);

  socket.on('register', (name) => {
    users[socket.id] = name;
    socket.emit('history', messages);
    io.emit('users', Object.values(users));
    console.log('👤', name, 'вошёл');
  });

  socket.on('message', (data) => {
    const from = users[socket.id] || 'Аноним';
    const msg = {
      id: Date.now(),
      from: from,
      text: data.text || '',
      type: data.type || 'text',
      data: data.data || '',
      chatId: data.chatId || 'all',
      time: new Date().toLocaleTimeString()
    };
    messages.push(msg);
    fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));
    io.emit('message', msg);
  });

  // Звонки
  socket.on('call', (data) => {
    socket.to(data.to).emit('call', {
      from: users[socket.id],
      signal: data.signal
    });
  });

  socket.on('call-answer', (data) => {
    socket.to(data.to).emit('call-answer', {
      from: users[socket.id],
      signal: data.signal
    });
  });

  socket.on('disconnect', () => {
    const name = users[socket.id];
    delete users[socket.id];
    io.emit('users', Object.values(users));
    console.log('❌', name || 'Кто-то', 'отключился');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
