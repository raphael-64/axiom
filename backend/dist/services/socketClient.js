"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnection = void 0;
const handleConnection = (io) => {
    io.on('connection', (socket) => {
        console.log(`New connection: ${socket.id}`);
        // Join room event
        socket.on('joinRoom', (room) => {
            socket.join(room);
            console.log(`Socket ${socket.id} joined room ${room}`);
            socket.to(room).emit('message', `User ${socket.id} joined the room.`);
        });
        // Leave room event
        socket.on('leaveRoom', (room) => {
            socket.leave(room);
            console.log(`Socket ${socket.id} left room ${room}`);
            socket.to(room).emit('message', `User ${socket.id} left the room.`);
        });
        // Send message to room
        socket.on('sendMessage', ({ room, message }) => {
            console.log(`Message from ${socket.id} to room ${room}: ${message}`);
            io.to(room).emit('message', `User ${socket.id}: ${message}`);
        });
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} disconnected`);
        });
    });
};
exports.handleConnection = handleConnection;
