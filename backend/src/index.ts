import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { promises as fs } from 'fs';
import { Server } from "socket.io";
import { handleConnection } from "./socketio";
import {
  getWorkspacesForUser,
  createNewWorkspace,
  deleteWorkspaceById,
  createWorkspaceInvite,
  handleInviteResponse,
  removeUserFromWorkspace,
} from "./utils/utils";
import cors from "cors";
import path from "path";

dotenv.config();

interface File {
  name: string;
  path: string;
}

interface FileMap {
  name: string;
  files: File[];
  // Add other properties if necessary
}

const app: Express = express();
const port = process.env.PORT || 3000;

const load_files_locally = true;

app.use(express.json());
app.use(cors());

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
    `https://student.cs.uwaterloo.ca/~se212${filename}`
  );
  return await file.json();
};

// Integrate the connection handler with Socket.IO
handleConnection(io);

// Express route
app.get("/", (req: Request, res: Response) => {
  res.send("SE212 Server");
});

// Get all workspaces
app.get("/api/workspaces", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["user-id"] as string; // You'll need to pass this from frontend
    const workspaces = await getWorkspacesForUser(userId);
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
});

// Create workspace
app.put("/api/workspaces", async (req: Request, res: Response) => {
  try {
    const userId = req.headers["user-id"] as string;

    //Ian's code below, need to finish
    const assignmentId: string = req.headers["assignment-id"] as string;
    const files_map = await getFiles(); // Await the result of getFiles
    //res.send(files_map);
    //console.log(files_map)
    let files: File[] = [];
    files_map.forEach((assignment: FileMap) => {
      if (assignment.name == assignmentId) {
        files = assignment.files;
      }
    });
    console.log(`Files: ${files}`);
    // Check if files is not null before iterating
    let loaded_files = [];
    if (files) {
      if (load_files_locally) {
        for (const file of files) {
          let filename = file.name;
          console.log(file.path)
          let local_filepath = path.join(__dirname, '../..', file.path); // Adjust the path as necessary
          const fileContent: string = await fs.readFile(local_filepath, 'utf8');
          loaded_files.push({"name": filename, "path": local_filepath, "content": fileContent})
          console.log({"name": filename, "path": local_filepath, "content": fileContent})
        }
      } else {
        files.forEach((file: File) => {
          // Loading files from remote, can't do that at the moment
          // let filename = file.name;
          // let filepath = file.path;
          // let fileContent = await getFile(filepath);
        });
      }
    }
    console.log(`Starting workspace with files: ${files}`)
    const workspace = await createNewWorkspace(userId, assignmentId, loaded_files);
    console.log("Finished creating workspace")
    res.json({ workspaceId: workspace.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to create workspace", error});
  }
});

// Delete workspace
app.delete("/api/workspaces", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = JSON.parse(req.body as string);
    await deleteWorkspaceById(workspaceId);
    res.json({ message: "Workspace deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete workspace" });
  }
});

// Invite to workspace
app.post("/api/workspaces/invite", async (req: Request, res: Response) => {
  try {
    const { userId } = JSON.parse(req.body as string);
    const workspaceId = req.headers["workspace-id"] as string;
    const invite = await createWorkspaceInvite(workspaceId, userId);
    res.json({ inviteId: invite.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to create invite" });
  }
});

// Accept/decline invite
app.post(
  "/api/workspaces/invite/accept",
  async (req: Request, res: Response) => {
    try {
      const { inviteId, accept } = JSON.parse(req.body as string);
      await handleInviteResponse(inviteId, accept);
      res.json({
        message: `Invitation ${accept ? "accepted" : "declined"} successfully`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process invite response" });
    }
  }
);

// Delete invite
app.delete("/api/workspaces/invite", async (req: Request, res: Response) => {
  try {
    const { inviteId } = JSON.parse(req.body as string);
    await handleInviteResponse(inviteId, false);
    res.json({ message: "Invitation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete invite" });
  }
});

// Remove collaborator
app.delete(
  "/api/workspaces/collaborator",
  async (req: Request, res: Response) => {
    try {
      const { userId } = JSON.parse(req.body as string);
      const workspaceId = req.headers["workspace-id"] as string;
      await removeUserFromWorkspace(workspaceId, userId);
      res.json({ message: "Collaborator removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  }
);

// Start the server
httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
