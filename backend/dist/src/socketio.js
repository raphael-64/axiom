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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConnection = void 0;
const Y = __importStar(require("yjs"));
const prisma_1 = __importDefault(require("./prisma"));
const utils_1 = require("@utils/utils");
// Map of all workspaces
const workspaces = new Map();
const handleConnection = (io) => {
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            socket.emit("error", "No user ID provided");
            socket.disconnect();
            return;
        }
        console.log(`New connection: ${socket.id} (User: ${userId})`);
        socket.on("joinRoom", (_a) => __awaiter(void 0, [_a], void 0, function* ({ workspaceId }) {
            console.log("joinRoom", workspaceId);
            // Check if user has permission to access this workspace
            if (!(yield checkUserAccess(userId, workspaceId))) {
                socket.emit("error", "Unauthorized access to workspace");
                return;
            }
            // Create new workspace data structure if it doesn't exist
            if (!workspaces.has(workspaceId)) {
                workspaces.set(workspaceId, { doc: new Map(), clients: new Map() });
            }
            // Get workspace and add client
            const workspace = workspaces.get(workspaceId);
            workspace.clients.set(socket.id, userId);
            // Join socket.io room for this workspace
            const roomId = `${workspaceId}`;
            socket.join(roomId);
            // Get workspace files from database
            const workspaceFiles = yield prisma_1.default.file.findMany({
                where: { workspaceId },
            });
            // Create Y.Doc for each file if needed
            for (const file of workspaceFiles) {
                if (!workspace.doc.has(file.path)) {
                    const doc = new Y.Doc();
                    // Initialize doc with content from DB
                    const ytext = doc.getText("content");
                    ytext.insert(0, file.content);
                    workspace.doc.set(file.path, doc);
                }
                // Get Y.Doc instance for this file
                const docData = workspace.doc.get(file.path);
                // Send current document state to new client
                const update = Y.encodeStateAsUpdate(docData);
                socket.emit("sync", {
                    path: file.path,
                    update: Buffer.from(update).toString("base64"),
                });
                // Notify other clients that a new user joined
                socket.to(roomId).emit("user-joined", {
                    userId,
                    path: file.path,
                });
            }
        }));
        socket.on("leaveRoom", ({ workspaceId }) => {
            console.log("leaveRoom", workspaceId);
            socket.leave(workspaceId);
            handleLeaveRoom(socket, workspaceId, userId);
        });
        // Handle document updates from clients
        socket.on("doc-update", ({ workspaceId, path, update }) => {
            // Get the workspace data structure
            const workspace = workspaces.get(workspaceId);
            if (!workspace)
                return;
            // Get the Y.Doc for this file path
            const docData = workspace.doc.get(path);
            if (!docData)
                return;
            // Convert base64 update to binary and apply to Y.Doc
            const binaryUpdate = Buffer.from(update, "base64");
            Y.applyUpdate(docData, binaryUpdate);
            // Get the current document content and save to disk
            const content = docData.getText("content").toString();
            (0, utils_1.debouncedUpdateFile)(workspaceId, path, content);
            // Broadcast update to all other clients in the room
            const roomId = `${workspaceId}:${path}`;
            socket.to(roomId).emit(`doc-update-${path}`, update);
        });
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            // Find workspace ID from room
            const workspaceId = Array.from(socket.rooms).find((room) => workspaces.has(room));
            // Delete client from workspace
            if (workspaceId && workspaces.has(workspaceId)) {
                handleLeaveRoom(socket, workspaceId, userId);
            }
        }));
    }));
};
exports.handleConnection = handleConnection;
function checkUserAccess(userId, workspaceId) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspace = yield prisma_1.default.workspace.findFirst({
            where: {
                id: workspaceId,
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
        });
        return workspace !== null;
    });
}
function handleLeaveRoom(socket, workspaceId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const workspace = workspaces.get(workspaceId);
        if (!workspace)
            return;
        workspace.clients.delete(socket.id);
        // Notify others that user left
        socket.to(workspaceId).emit("user-left", {
            userId,
        });
        // Delete workspace in memory if no connected clients left
        if (workspace.clients.size === 0) {
            workspace.doc.forEach((doc, path) => {
                workspace.doc.delete(path);
            });
            workspaces.delete(workspaceId); // Delete workspace in memory
        }
    });
}
