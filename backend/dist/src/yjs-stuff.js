"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Y = __importStar(require("yjs"));
const yjs_1 = require("yjs");
const rooms = new Map();
// Implement this stuff into your existing code
io.on("connection", (socket) => {
    socket.on("joinFile", ({ roomId, fileId }) => {
        socket.join(`${roomId}:${fileId}`);
        // Create room if doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, {
                docs: new Map(),
                clients: new Set(),
            });
        }
        const room = rooms.get(roomId);
        room.clients.add(socket.id);
        // Create doc if doesn't exist
        if (!room.docs.has(fileId)) {
            room.docs.set(fileId, new Y.Doc());
        }
        // Send current document state to new client
        const doc = room.docs.get(fileId);
        const update = (0, yjs_1.encodeStateAsUpdate)(doc);
        socket.emit("sync", {
            fileId,
            update: Buffer.from(update).toString("base64"),
        });
    });
    socket.on("update", ({ roomId, fileId, update, }) => {
        const room = rooms.get(roomId);
        if (!room)
            return;
        const doc = room.docs.get(fileId);
        if (!doc)
            return;
        // Apply update to server's doc
        const binaryUpdate = Buffer.from(update, "base64");
        Y.applyUpdate(doc, binaryUpdate);
        // Broadcast to all other clients in same file
        socket.to(`${roomId}:${fileId}`).emit("update", {
            fileId,
            update,
        });
    });
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
