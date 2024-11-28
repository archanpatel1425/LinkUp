const { getUsersInRoom, addUserToRoom, removeUserFromRoom } = require('../utils/roomUtils');

function joinRoom(roomId, user, isWaiting = false) {
    addUserToRoom(roomId, user, isWaiting);
    return getUsersInRoom(roomId);
}

function leaveRoom(roomId, socketId) {
    removeUserFromRoom(roomId, socketId);
    return getUsersInRoom(roomId);
}

module.exports = { joinRoom, leaveRoom };
