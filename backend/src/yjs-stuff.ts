import * as Y from "yjs";
import {
  encodeStateVector,
  encodeStateAsUpdate,
  applyUpdate,
  encodeUpdate,
} from "yjs";

const rooms = new Map<
  string,
  {
    docs: Map<string, Y.Doc>; // fileId -> Y.Doc
    clients: Set<string>; // socket IDs
  }
>();

// Implement this stuff into your existing code
io.on("connection", (socket: Socket) => {
  socket.on(
    "joinFile",
    ({ roomId, fileId }: { roomId: string; fileId: string }) => {
      socket.join(`${roomId}:${fileId}`);

      // Create room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          docs: new Map(),
          clients: new Set(),
        });
      }

      const room = rooms.get(roomId)!;
      room.clients.add(socket.id);

      // Create doc if doesn't exist
      if (!room.docs.has(fileId)) {
        room.docs.set(fileId, new Y.Doc());
      }

      // Send current document state to new client
      const doc = room.docs.get(fileId)!;
      const update = encodeStateAsUpdate(doc);
      socket.emit("sync", {
        fileId,
        update: Buffer.from(update).toString("base64"),
      });
    }
  );

  socket.on(
    "update",
    ({
      roomId,
      fileId,
      update,
    }: {
      roomId: string;
      fileId: string;
      update: string;
    }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const doc = room.docs.get(fileId);
      if (!doc) return;

      // Apply update to server's doc
      const binaryUpdate = Buffer.from(update, "base64");
      Y.applyUpdate(doc, binaryUpdate);

      // Broadcast to all other clients in same file
      socket.to(`${roomId}:${fileId}`).emit("update", {
        fileId,
        update,
      });
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
});
