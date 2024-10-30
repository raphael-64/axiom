"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("@utils/utils"); // Adjust the path if necessary
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
// Integrate the connection handler with Socket.IO
(0, socketClient_1.handleConnection)(io);
// Express route
app.get("/", (req, res) => {
    res.send("Express + hi Server");
    (0, utils_1.greet)("Hello");
});
// Start the server
httpServer.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
