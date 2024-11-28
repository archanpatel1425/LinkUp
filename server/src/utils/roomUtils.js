const rooms = require('../models/rooms');

function getUsersInRoom(roomId) {
    if (!rooms.has(roomId)) return { participants: {}, waitingUsers: {} };
    return rooms.get(roomId);
}

function addUserToRoom(roomId, user, isWaiting = false) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, { participants: {}, waitingUsers: {} });
    }
    const room = rooms.get(roomId);
    const userType = isWaiting ? 'waitingUsers' : 'participants';
    room[userType][user.socketId] = user;
    rooms.set(roomId, room);
}

function removeUserFromRoom(roomId, socketId) {
    if (!rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    delete room.participants[socketId];
    delete room.waitingUsers[socketId];

    // Delete room if empty
    if (Object.keys(room.participants).length === 0 && Object.keys(room.waitingUsers).length === 0) {
        rooms.delete(roomId);
    } else {
        rooms.set(roomId, room);
    }
}

module.exports = { getUsersInRoom, addUserToRoom, removeUserFromRoom };
