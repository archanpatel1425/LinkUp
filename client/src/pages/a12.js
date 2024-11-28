const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Store rooms and user information
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    console.log(`${username} (${socket.id}) joined room: ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    rooms.get(roomId).set(socket.id, {
      username,
      videoOn: true,
      audioOn: true,
      screenShareOn: false
    });

    // Notify all users in the room about the new user
    socket.to(roomId).emit('user-joined', socket.id, username);

    // Send the list of all users in the room to the new user
    const usersInRoom = Array.from(rooms.get(roomId)).map(([id, user]) => ({
      id,
      username: user.username,
      videoOn: user.videoOn,
      audioOn: user.audioOn,
      screenShareOn: user.screenShareOn
    }));
    console.log('---------------------------------------')

    socket.emit('room-users', usersInRoom);
  });

  socket.on('offer', (offer, userId) => {
    io.to(userId).emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, userId) => {
    io.to(userId).emit('answer', answer, socket.id);
  });

  socket.on('ice-candidate', (candidate, userId) => {
    io.to(userId).emit('ice-candidate', candidate, socket.id);
  });

  socket.on('chat-message', (message, roomId) => {
    const user = rooms.get(roomId).get(socket.id);
    io.to(roomId).emit('chat-message', message, socket.id, user.username);
  });

  socket.on('toggle-audio', (roomId, audioOn) => {
    if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
      rooms.get(roomId).get(socket.id).audioOn = audioOn;
      socket.to(roomId).emit('user-audio-update', socket.id, audioOn);
    }
  });

  socket.on('toggle-video', (roomId, videoOn) => {
    if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
      rooms.get(roomId).get(socket.id).videoOn = videoOn;
      socket.to(roomId).emit('user-video-update', socket.id, videoOn);
    }
  });

  socket.on('toggle-screen-share', (roomId, screenShareOn) => {
    if (rooms.has(roomId) && rooms.get(roomId).has(socket.id)) {
      rooms.get(roomId).get(socket.id).screenShareOn = screenShareOn;
      socket.to(roomId).emit('user-screen-share-update', socket.id, screenShareOn);
    }
  });

  socket.on('leave-room', (roomId) => {
    handleUserLeaving(socket, roomId);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(socket.id)) {
        handleUserLeaving(socket, roomId);
      }
    }
  });
});

function handleUserLeaving(socket, roomId) {
  if (rooms.has(roomId)) {
    const user = rooms.get(roomId).get(socket.id);
    if (user) {
      console.log(`${user.username} (${socket.id}) left room: ${roomId}`);
      rooms.get(roomId).delete(socket.id);
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
      socket.leave(roomId);
      io.to(roomId).emit('user-disconnected', socket.id, user.username);
    }
  }
}

server.listen(5000, () => {
  console.log('Server is running on port 5000');
});

in show participent it not showing participents . i want to print participent's usernames there so make event to get data fix this issue . then on mic,camera ,screenshare on/off call event on backend which already set in backed .just change in fronnted .