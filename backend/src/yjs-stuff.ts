import * as Y from "yjs";
import {
  encodeStateVector,
  encodeStateAsUpdate,
  applyUpdate,
  encodeUpdate,
} from "yjs";

interface Room {
  doc: Y.Doc;
  clients: Set<string>;
}

// Implement this stuff into your existing code

socket.on("joinRoom", (roomId: string) => {
  socket.join(roomId);

  // Create room if doesn't exist
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      doc: new Y.Doc(),
      clients: new Set(),
    });
  }

  const room = rooms.get(roomId)!;
  room.clients.add(socket.id);

  // Send current document state to new client
  const update = encodeStateAsUpdate(room.doc);
  socket.emit("sync", Buffer.from(update).toString("base64"));
});

socket.on(
  "update",
  ({ roomId, update }: { roomId: string; update: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    // Apply update to server's doc
    const binaryUpdate = Buffer.from(update, "base64");
    applyUpdate(room.doc, binaryUpdate);

    // Broadcast to all other clients in room
    socket.to(roomId).emit("update", update);
  }
);

socket.on("disconnect", () => {
  // Remove client from all rooms
  for (const [roomId, room] of rooms.entries()) {
    room.clients.delete(socket.id);

    // Delete room if empty
    if (room.clients.size === 0) {
      rooms.delete(roomId);
    }
  }
});
