import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleConnection } from "@services/socketClient"; // Adjust the path as needed

dotenv.config();

interface File {
  name: string
  path: string
}

interface FileMap {
  name: string;
  files: File[];
  // Add other properties if necessary
}

const app: Express = express();
const port = process.env.PORT || 3000;

const load_files_locally = false;

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

const getFile = async (filename: string) => {
  const file = await fetch(
    `https://student.cs.uwaterloo.ca/~se212/${filename}`
  );
  return await file.json();
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
app.put("/create-workspace/:assignmentId", async (req: Request, res: Response) => {
  // Get all of the files
  const assignmentId: string = req.params.assignmentId
  const files_map = await getFiles(); // Await the result of getFiles
  res.send(files_map)
  let files: File[] = [];
  files_map.forEach((assignment: FileMap) => {
    if (assignment.name == assignmentId) {
      files = assignment.files
    }
  });
  console.log(files)
  // Check if files is not null before iterating
  let loaded_files = []
  if (files) {
    if(load_files_locally) {
      files.forEach((file: File) => {
        
      });
    } else {
      files.forEach((file: File) => {
        let filename = file.name
        let filepath = file.path
        let fileContent = await getFile(filepath);
        // continue from here next tiem
      });
    }
  }

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