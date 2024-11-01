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
const socket_io_1 = require("socket.io");
const Y = __importStar(require("yjs"));
const io = new socket_io_1.Server(3001, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});
const workspaces = new Map();
io.on("connection", (socket) => {
    /*
  
  
  
  
  
  
    Stuff that might be important (begin)
    */
    socket.on("joinRoom", ({ workspaceId, path }) => {
        socket.join(workspaceId);
        if (!workspaces.has(workspaceId)) {
            workspaces.set(workspaceId, new Map());
        }
        const workspace = workspaces.get(workspaceId);
        if (!workspace.has(path)) {
            workspace.set(path, new Y.Doc());
        }
    });
    socket.on("doc-update", ({ workspaceId, path, update }) => {
        socket.to(workspaceId).emit(`doc-update-${path}`, update);
    });
    /*
    Stuff that might be important (end)
  
  
  
  
  
    */
    socket.on("leaveRoom", (workspaceId) => {
        socket.leave(workspaceId);
    });
    socket.on("disconnect", () => {
        // Clean up if needed
    });
});
