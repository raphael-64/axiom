"use strict";
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
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const socketClient_1 = require("@services/socketClient"); // Adjust the path as needed
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Create an HTTP server
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.IO with the HTTP server
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Adjust for security if needed
    },
});
const getFiles = () => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield fetch("https://student.cs.uwaterloo.ca/~se212/files.json");
    return yield files.json();
});
// Integrate the connection handler with Socket.IO
(0, socketClient_1.handleConnection)(io);
// Express route
app.get("/", (req, res) => {
    res.send("Foole Server");
});
//Get all workspaces
app.get("/get-workspaces/:userId", (req, res) => {
    const userId = req.params.userId;
});
//Update workspace sharing
app.post("/update-sharing", (req, res) => {
});
//Create a new workspace
app.put("/create-workspace", (req, res) => {
    // Get all of the files
    const files = getFiles();
    res.send(files);
});
//Delete a workspace
app.delete("/delete-workspace", (req, res) => {
});
//Create workspace
//Delete workspace
// Start the server
httpServer.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
