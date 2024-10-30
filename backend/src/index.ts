import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { greet } from '@utils/utils'; // Adjust the path if necessary
import { createServer } from "http";
import { Server } from "socket.io";
import { handleConnection } from "@services/socketClient"; // Adjust the path as needed

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Create an HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for security if needed
  },
});

// Integrate the connection handler with Socket.IO
handleConnection(io);

// Express route
app.get("/", (req: Request, res: Response) => {
  res.send("Express + hi Server");
  greet("Hello");
});

// Start the server
httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});