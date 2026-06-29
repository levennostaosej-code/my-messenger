const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public')); // Для HTML-клиента

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Хранилище сообщений (в памяти)
const messages = [];

io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.id);

  // Отправить историю новому пользователю
  socket.emit('history', messages);

  // Обработка нового сообщения
  socket.on('message', (data) => {
    const msg = {
      id: Date.now(),
      user: data.user,
      text: data.text,
      time: new Date().toLocaleTimeString()
    };
    messages.push(msg);
    io.emit('message', msg); // Рассылаем всем
  });

  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
