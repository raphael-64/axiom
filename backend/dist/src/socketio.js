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
// Replace the single awarenessStates map with a file-specific one
// Map<workspaceId, Map<filePath, Map<clientId, state>>>
const fileAwareness = new Map();
// Add this to track which file each client is currently viewing
const clientFiles = new Map();
const handleConnection = (io) => {
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            socket.emit("error", "No user ID provided");
            socket.disconnect();
            return;
        }
        console.log(`New connection: ${socket.id} (User: ${userId})`);
        socket.on("joinRoom", (_a) => __awaiter(void 0, [_a], void 0, function* ({ workspaceId, path }) {
            console.log("joinRoom", workspaceId);
            // Check if user has permission to access this workspace
            if (!(yield checkUserAccess(userId, workspaceId))) {
                socket.emit("error", "Unauthorized access");
                return;
            }
            // Initialize workspace if needed
            if (!workspaces.has(workspaceId)) {
                workspaces.set(workspaceId, {
                    docs: new Map(),
                    clients: new Set(),
                });
            }
            const workspace = workspaces.get(workspaceId);
            workspace.clients.add(socket.id);
            socket.join(workspaceId);
            // Only load requested file
            if (!workspace.docs.has(path)) {
                const file = yield prisma_1.default.file.findFirst({
                    where: { workspaceId, path },
                });
                if (!file) {
                    socket.emit("error", "File not found");
                    return;
                }
                const yDoc = new Y.Doc();
                const ytext = yDoc.getText("content");
                ytext.insert(0, file.content);
                workspace.docs.set(path, {
                    yDoc,
                    content: file.content,
                    lastSaved: Date.now(),
                });
            }
            // Send current doc state
            const docData = workspace.docs.get(path);
            const update = Y.encodeStateAsUpdate(docData.yDoc);
            socket.emit("sync", Buffer.from(update).toString("base64"));
            // Update client's current file
            clientFiles.set(socket.id, { workspaceId, path });
            // Initialize file awareness if needed
            if (!fileAwareness.has(workspaceId)) {
                fileAwareness.set(workspaceId, new Map());
            }
            const workspaceAwareness = fileAwareness.get(workspaceId);
            if (!workspaceAwareness.has(path)) {
                workspaceAwareness.set(path, new Map());
            }
            // Send current awareness states for this file
            const fileStates = workspaceAwareness.get(path);
            socket.emit("awareness-update", {
                states: Array.from(fileStates.entries()),
            });
        }));
        socket.on("leaveRoom", ({ workspaceId }) => {
            console.log("leaveRoom", workspaceId);
            socket.leave(workspaceId);
            handleLeaveRoom(socket, workspaceId, userId);
        });
        // Handle document updates from clients
        socket.on("doc-update", ({ workspaceId, path, update }) => {
            const workspace = workspaces.get(workspaceId);
            if (!(workspace === null || workspace === void 0 ? void 0 : workspace.docs.has(path)))
                return;
            const docData = workspace.docs.get(path);
            const binaryUpdate = Buffer.from(update, "base64");
            Y.applyUpdate(docData.yDoc, binaryUpdate);
            const newContent = docData.yDoc.getText("content").toString();
            // Only save if content actually changed
            if (newContent !== docData.content) {
                docData.content = newContent;
                docData.lastSaved = Date.now();
                console.log("saving file", workspaceId, path, newContent);
                (0, utils_1.debouncedUpdateFile)(workspaceId, path, newContent);
            }
            socket.to(workspaceId).emit(`doc-update-${path}`, update);
        });
        socket.on("requestFileContent", ({ workspaceId, path }) => {
            const workspace = workspaces.get(workspaceId);
            if (!workspace)
                return;
            const docData = workspace.docs.get(path);
            if (!docData)
                return;
            const content = docData.yDoc.getText("content").toString();
            socket.emit("fileContent", {
                path,
                content,
            });
        });
        socket.on("awareness", ({ workspaceId, path, clientId, state }) => {
            const clientFile = clientFiles.get(socket.id);
            if (!clientFile || clientFile.workspaceId !== workspaceId)
                return;
            const workspaceAwareness = fileAwareness.get(workspaceId);
            if (!workspaceAwareness)
                return;
            const fileStates = workspaceAwareness.get(clientFile.path);
            if (!fileStates)
                return;
            // Update state for this client
            fileStates.set(socket.id, state);
            // Log awareness data for debugging
            console.log("\n=== Awareness Update ===");
            console.log("File:", clientFile.path);
            console.log("Connected clients:");
            fileStates.forEach((state, clientId) => {
                var _a, _b, _c, _d, _e, _f;
                console.log(`\nClient ${clientId}:`);
                console.log("User:", (_a = state.user) === null || _a === void 0 ? void 0 : _a.name);
                console.log("Color:", (_b = state.user) === null || _b === void 0 ? void 0 : _b.color);
                console.log("Cursor:", (_d = (_c = state.user) === null || _c === void 0 ? void 0 : _c.cursor) === null || _d === void 0 ? void 0 : _d.position);
                console.log("Selection:", (_f = (_e = state.user) === null || _e === void 0 ? void 0 : _e.cursor) === null || _f === void 0 ? void 0 : _f.selection);
            });
            console.log("========================\n");
            // Only broadcast to others viewing the same file
            socket.to(workspaceId).emit("awareness-update", {
                path,
                clientId,
                state,
            });
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
            clientId: socket.id,
            userId,
        });
        // Delete workspace in memory if no connected clients left
        if (workspace.clients.size === 0) {
            workspace.docs.forEach((doc, path) => {
                workspace.docs.delete(path);
            });
            workspaces.delete(workspaceId); // Delete workspace in memory
        }
        // Clean up awareness data
        const clientFile = clientFiles.get(socket.id);
        if (clientFile) {
            const workspaceAwareness = fileAwareness.get(workspaceId);
            if (workspaceAwareness) {
                const fileStates = workspaceAwareness.get(clientFile.path);
                if (fileStates) {
                    fileStates.delete(socket.id);
                    // Clean up empty maps
                    if (fileStates.size === 0) {
                        workspaceAwareness.delete(clientFile.path);
                    }
                    if (workspaceAwareness.size === 0) {
                        fileAwareness.delete(workspaceId);
                    }
                    // Notify others viewing this file
                    socket.to(workspaceId).emit("awareness-update", {
                        path: clientFile.path,
                        states: Array.from(fileStates.entries()),
                    });
                }
            }
            clientFiles.delete(socket.id);
        }
    });
}
