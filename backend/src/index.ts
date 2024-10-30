import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
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

const getFiles = async () => {
  const files = await fetch(
    "https://student.cs.uwaterloo.ca/~se212/files.json"
  );
  return await files.json();
};

// Integrate the connection handler with Socket.IO
handleConnection(io);

// Express route
app.get("/", (req: Request, res: Response) => {
  res.send("Foole Server");
});


//Get all workspaces
app.get("/get-workspaces/:userId", (req: Request, res: Response) => {
  const userId = req.params.userId;
  
});


//Update workspace sharing
app.post("/update-sharing", (req: Request, res: Response) => {
  
});

//Create a new workspace
app.put("/create-workspace", (req: Request, res: Response) => {
  // Get all of the files
  const files = getFiles();
  res.send(files)

});

//Delete a workspace
app.delete("/delete-workspace", (req: Request, res: Response) => {
  
});


//Create workspace

//Delete workspace


// Start the server
httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});