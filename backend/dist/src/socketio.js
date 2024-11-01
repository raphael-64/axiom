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
exports.handleConnection = void 0;
const Y = __importStar(require("yjs"));
// Store active workspaces and their documents
const workspaces = new Map();
const handleConnection = (io) => {
    io.on("connection", (socket) => {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            socket.emit("error", "No user ID provided");
            socket.disconnect();
            return;
        }
        console.log(`New connection: ${socket.id} (User: ${userId})`);
        socket.on("joinRoom", ({ workspaceId, path }) => {
            const roomId = `${workspaceId}:${path}`;
            socket.join(roomId);
            // Initialize workspace if needed
            if (!workspaces.has(workspaceId)) {
                workspaces.set(workspaceId, new Map());
            }
            const workspace = workspaces.get(workspaceId);
            // Initialize document if needed
            if (!workspace.has(path)) {
                workspace.set(path, {
                    doc: new Y.Doc(),
                    clients: new Map(),
                });
            }
            const docData = workspace.get(path);
            docData.clients.set(socket.id, userId);
            // Send current document state to new client
            const update = Y.encodeStateAsUpdate(docData.doc);
            socket.emit("sync", {
                path,
                update: Buffer.from(update).toString("base64"),
            });
            // Notify others that user joined
            socket.to(roomId).emit("user-joined", {
                userId,
                path,
            });
        });
        socket.on("doc-update", ({ workspaceId, path, update }) => {
            const workspace = workspaces.get(workspaceId);
            if (!workspace)
                return;
            const docData = workspace.get(path);
            if (!docData)
                return;
            // Verify user is in workspace
            if (!docData.clients.has(socket.id)) {
                socket.emit("error", "Not authorized to edit this document");
                return;
            }
            // Apply update to server's doc
            const binaryUpdate = Buffer.from(update, "base64");
            Y.applyUpdate(docData.doc, binaryUpdate);
            // Broadcast to all other clients in same file
            const roomId = `${workspaceId}:${path}`;
            socket.to(roomId).emit(`doc-update-${path}`, update);
        });
        socket.on("leaveRoom", (workspaceId) => {
            const workspace = workspaces.get(workspaceId);
            if (!workspace)
                return;
            // Remove client from all docs in workspace
            for (const [path, docData] of workspace.entries()) {
                if (docData.clients.has(socket.id)) {
                    const roomId = `${workspaceId}:${path}`;
                    socket.to(roomId).emit("user-left", {
                        userId,
                        path,
                    });
                    docData.clients.delete(socket.id);
                }
                // Clean up doc if no clients left
                if (docData.clients.size === 0) {
                    workspace.delete(path);
                }
            }
            // Clean up workspace if empty
            if (workspace.size === 0) {
                workspaces.delete(workspaceId);
            }
        });
        socket.on("disconnect", () => {
            // Clean up client from all workspaces
            for (const workspace of workspaces.values()) {
                for (const [path, docData] of workspace.entries()) {
                    if (docData.clients.has(socket.id)) {
                        docData.clients.delete(socket.id);
                        if (docData.clients.size === 0) {
                            workspace.delete(path);
                        }
                    }
                }
            }
            // Clean up empty workspaces
            for (const [workspaceId, workspace] of workspaces.entries()) {
                if (workspace.size === 0) {
                    workspaces.delete(workspaceId);
                }
            }
        });
    });
};
exports.handleConnection = handleConnection;
