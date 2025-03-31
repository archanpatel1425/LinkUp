function get_users_in_room(roomId, rooms) {
  if (!rooms.has(roomId)) return { participants: {}, waitingUsers: {} };

  const roomData = rooms.get(roomId);
  const participants = roomData.get('participants');
  const waitingUsers = roomData.get('waiting room users');

  return {
    participants,
    waitingUsers
  };
}

function handleUserLeaving(socket, roomId, io, rooms) {
  if (rooms.has(roomId)) {
    const participants = rooms.get(roomId).get('participants');
    const waitingUsers = rooms.get(roomId).get('waiting room users');

    let user;
    if (participants[socket.id]) {
      user = participants[socket.id];
      delete participants[socket.id];
    } else if (waitingUsers[socket.id]) {
      user = waitingUsers[socket.id];
      delete waitingUsers[socket.id];
    }

    if (user) {
      // console.log(`${user.username} (${socket.id}) left room: ${roomId}`);

      if (Object.keys(participants).length === 0 && Object.keys(waitingUsers).length === 0) {
        rooms.delete(roomId);
      }

      socket.leave(roomId);
      io.to(roomId).emit('user-disconnected', socket.id, user.username);
      io.to(roomId).emit('room-users', get_users_in_room(roomId, rooms));
      // console.log("-----------------------------------------");
      // console.log(get_users_in_room(roomId, rooms));
    }
  }
}

module.exports = { get_users_in_room, handleUserLeaving };
