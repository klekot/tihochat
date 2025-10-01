const db = require('./database');
const { generateAvatarUrl } = require('../utils/fileUtils');

const setupSocketIO = (io) => {
    io.on('connection', (socket) => {
        socket.on('join-room', (roomId, userId, dbUserId, userName) => {
            socket.join(roomId);
            
            setTimeout(() => {
                socket.to(roomId).emit('user-connected', userId);
            }, 1000);

            socket.on('message', async (message) => {
                try {
                    const users = await db.getUserById(dbUserId);
                    
                    let avatarUrl = '/default_avatar.jpg';
                    if (users && users.length === 1) {
                        avatarUrl = generateAvatarUrl(dbUserId, users[0].avatar);
                    }
                    
                    io.to(roomId).emit('createMessage', message, userName, avatarUrl);
                } catch (error) {
                    console.error('Socket message error:', error);
                }
            });
        });

        socket.on('audio_disabled', (roomId, userId, userName) => {
            socket.join(roomId);
            socket.to(roomId).emit('audioDisabled', userId, userName);
        });

        socket.on('audio_enabled', (roomId, userId, userName) => {
            socket.join(roomId);
            socket.to(roomId).emit('audioEnabled', userId, userName);
        });
    });
};

module.exports = setupSocketIO;
