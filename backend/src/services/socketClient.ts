import { Server, Socket } from 'socket.io';

export const handleConnection = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

    // Join room event
    socket.on('joinRoom', (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
      socket.to(room).emit('message', `User ${socket.id} joined the room.`);
    });

    // Leave room event
    socket.on('leaveRoom', (room: string) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
      socket.to(room).emit('message', `User ${socket.id} left the room.`);
    });

    // Send message to room
    socket.on('sendMessage', ({ room, message }: { room: string; message: string }) => {
      console.log(`Message from ${socket.id} to room ${room}: ${message}`);
      io.to(room).emit('message', `User ${socket.id}: ${message}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
    });
  });
};
