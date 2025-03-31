const socketIO = require('socket.io');
const { get_users_in_room, handleUserLeaving } = require('../controllers/roomController');

const rooms = new Map(); 

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {

    socket.on('join-waiting-room', (roomId, username, userId, initialStates = { videoOn: true, micOn: true }) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map([
          ['participants', {}],
          ['waiting room users', {}]
        ]));
      }

      const userDetails = {
        userId,
        username,
        videoOn: initialStates.videoOn,
        audioOn: initialStates.micOn,
        screenShareOn: false
      };

      rooms.get(roomId).get('waiting room users')[socket.id] = userDetails;

      io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
    });

    socket.on('join-room', (roomId, username, userId) => {
      socket.join(roomId);

      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map([
          ['participants', {}],
          ['waiting room users', {}]
        ]));
      }

      const userDetails = {
        userId,
        username,
        videoOn: true,
        audioOn: true,
        screenShareOn: false
      };

      rooms.get(roomId).get('participants')[socket.id] = userDetails;

      socket.to(roomId).emit('user-joined', socket.id);
      io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
    });

    socket.on('admit-user', (roomId, userSocketId) => {
      if (rooms.has(roomId)) {
        const waitingUsers = rooms.get(roomId).get('waiting room users');
        const participants = rooms.get(roomId).get('participants');

        if (waitingUsers[userSocketId]) {
          participants[userSocketId] = waitingUsers[userSocketId];
          delete waitingUsers[userSocketId];

          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));

          io.to(userSocketId).emit('admitted-to-room', participants[userSocketId]);
        }
      }
    });

    socket.on('offer', (offer, userSocketId, username) => {
      io.to(userSocketId).emit('offer', offer, socket.id, username);
    });

    socket.on('answer', (answer, userSocketId) => {
      io.to(userSocketId).emit('answer', answer, socket.id);
    });

    socket.on('ice-candidate', (candidate, userSocketId) => {
      io.to(userSocketId).emit('ice-candidate', candidate, socket.id);
    });

    socket.on('toggle-audio', (roomId, audioOn) => {
      if (rooms.has(roomId)) {
        const participants = rooms.get(roomId).get('participants');
        if (participants[socket.id]) {
          participants[socket.id].audioOn = audioOn;
          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
        }
      }
    });

    socket.on('toggle-video', (roomId, videoOn) => {
      if (rooms.has(roomId)) {
        const participants = rooms.get(roomId).get('participants');
        if (participants[socket.id]) {
          participants[socket.id].videoOn = videoOn;
          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
        }
      }
    });

    socket.on('toggle-screen-share', (roomId, screenShareOn) => {
      if (rooms.has(roomId)) {
        const participants = rooms.get(roomId).get('participants');
        if (participants[socket.id]) {
          participants[socket.id].screenShareOn = screenShareOn;
          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
        }
      }
    });

    socket.on('leave-room', (roomId) => {
      handleUserLeaving(socket, roomId, io, rooms);
    });

    socket.on('disconnect', () => {
      for (const [roomId] of rooms.entries()) {
        handleUserLeaving(socket, roomId, io, rooms);
      }
    });
  });
};

module.exports = initializeSocket;
