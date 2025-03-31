const socketIO = require('socket.io');
const { get_users_in_room, handleUserLeaving } = require('../controllers/roomController');

const rooms = new Map(); // Move room storage here for simplicity

const initializeSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  io.on('connection', (socket) => {
    // console.log('New user connected:', socket.id);

    socket.on('join-waiting-room', (roomId, username, userId, initialStates = { videoOn: true, micOn: true }) => {
      // console.log('Event: join-waiting-room');
      socket.join(roomId);
      // console.log(`${username} (${socket.id}) joined waiting room for: ${roomId}`);

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
      // console.log("-----------------------------------------");
      // console.log(get_users_in_room(roomId, rooms));
    });

    socket.on('join-room', (roomId, username, userId) => {
      // console.log('Event: join-room');
      socket.join(roomId);
      // console.log(`${username} (${socket.id}) joined room: ${roomId}`);

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
      // console.log('======================', username, '======================')
      io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
      // console.log("-----------------------------------------");
      // console.log(get_users_in_room(roomId, rooms));
    });

    socket.on('admit-user', (roomId, userSocketId) => {
      // console.log('Event: admit-user');
      if (rooms.has(roomId)) {
        const waitingUsers = rooms.get(roomId).get('waiting room users');
        const participants = rooms.get(roomId).get('participants');

        if (waitingUsers[userSocketId]) {
          participants[userSocketId] = waitingUsers[userSocketId];
          delete waitingUsers[userSocketId];

          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
          // console.log("-----------------------------------------");
          // console.log(get_users_in_room(roomId, rooms));

          io.to(userSocketId).emit('admitted-to-room', participants[userSocketId]);
        }
      }
    });

    socket.on('offer', (offer, userSocketId, username) => {
      // console.log('Event: offer');
      io.to(userSocketId).emit('offer', offer, socket.id, username);
    });

    socket.on('answer', (answer, userSocketId) => {
      // console.log('Event: answer');
      io.to(userSocketId).emit('answer', answer, socket.id);
    });

    socket.on('ice-candidate', (candidate, userSocketId) => {
      // console.log('Event: ice-candidate');
      io.to(userSocketId).emit('ice-candidate', candidate, socket.id);
    });

    socket.on('toggle-audio', (roomId, audioOn) => {
      // console.log('Event: toggle-audio');
      if (rooms.has(roomId)) {
        const participants = rooms.get(roomId).get('participants');
        if (participants[socket.id]) {
          participants[socket.id].audioOn = audioOn;
          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
          // console.log("-----------------------------------------");
          // console.log(get_users_in_room(roomId, rooms));
        }
      }
    });

    socket.on('toggle-video', (roomId, videoOn) => {
      // console.log('Event: toggle-video');
      if (rooms.has(roomId)) {
        const participants = rooms.get(roomId).get('participants');
        if (participants[socket.id]) {
          participants[socket.id].videoOn = videoOn;
          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
          // console.log("-----------------------------------------");
          // console.log(get_users_in_room(roomId, rooms));
        }
      }
    });

    socket.on('toggle-screen-share', (roomId, screenShareOn) => {
      // console.log('Event: toggle-screen-share');
      if (rooms.has(roomId)) {
        const participants = rooms.get(roomId).get('participants');
        if (participants[socket.id]) {
          participants[socket.id].screenShareOn = screenShareOn;
          io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
          // console.log("-----------------------------------------");
          // console.log(get_users_in_room(roomId, rooms));
        }
      }
    });

    socket.on('leave-room', (roomId) => {
      // console.log('Event: leave-room');
      handleUserLeaving(socket, roomId, io, rooms);
    });

    socket.on('disconnect', () => {
      // console.log('Event: disconnect');
      // console.log('User disconnected:', socket.id);
      for (const [roomId] of rooms.entries()) {
        handleUserLeaving(socket, roomId, io, rooms);
      }
    });
  });
};

module.exports = initializeSocket;
