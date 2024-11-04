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
const workspaces = new Map();
const handleConnection = (io) => {
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const userId = socket.handshake.auth.userId;
        const workspaceId = socket.handshake.auth.workspaceId;
        if (!(yield checkUserAccess(userId, workspaceId))) {
            socket.emit("error", "Unauthorized access to workspace");
            socket.disconnect();
            return;
        }
        console.log(`New connection: ${socket.id} (User: ${userId})`);
        if (!workspaces.has(workspaceId)) {
            workspaces.set(workspaceId, { doc: new Map(), clients: new Map() });
        }
        const workspace = workspaces.get(workspaceId);
        workspace.clients.set(socket.id, userId);
        socket.on("joinRoom", ({ workspaceId, path }) => {
            const roomId = `${workspaceId}:${path}`;
            socket.join(roomId);
            if (!workspace.doc.has(path)) {
                workspace.doc.set(path, new Y.Doc());
            }
            const docData = workspace.doc.get(path);
            // Send current document state to new client
            const update = Y.encodeStateAsUpdate(docData);
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
            if (!workspace)
                return;
            const docData = workspace.doc.get(path);
            if (!docData)
                return;
            const binaryUpdate = Buffer.from(update, "base64");
            Y.applyUpdate(docData, binaryUpdate);
            const content = docData.getText("content").toString();
            (0, utils_1.debouncedUpdateFile)(workspaceId, path, content);
            const roomId = `${workspaceId}:${path}`;
            socket.to(roomId).emit(`doc-update-${path}`, update);
        });
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            if (workspace) {
                workspace.clients.delete(socket.id);
                socket.to(workspaceId).emit("user-left", {
                    userId,
                });
                if (workspace.clients.size === 0) {
                    workspace.doc.forEach((doc, path) => {
                        workspace.doc.delete(path);
                    });
                    workspaces.delete(workspaceId);
                    yield prisma_1.default.workspace.delete({
                        where: { id: workspaceId },
                    });
                }
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
