import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { promises as fs } from "fs";
import { Server } from "socket.io";
import { handleConnection } from "./socketio";
import {
  getWorkspacesForUser,
  createNewWorkspace,
  deleteWorkspaceById,
  createWorkspaceInvite,
  handleInviteResponse,
  removeUserFromWorkspace,
  getWorkspaceUsers,
  getWorkspaceInvites,
  getInvitesForUser,
} from "./utils/utils";
import cors from "cors";
import path from "path";
import { PrismaClient } from "@prisma/client";

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
const port = process.env.PORT || 4000;

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

// Integrate the connection handler with Socket.IO
handleConnection(io);

const getFiles = async () => {
  const files = await fetch(
    "https://student.cs.uwaterloo.ca/~se212/files.json"
  );
  return await files.json();
};

// Express route
app.get("/", (req: Request, res: Response) => {
  res.send("SE212 Server");
});

// Get all workspaces
app.get("/api/workspaces", async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const workspaces = await getWorkspacesForUser(userId);
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
});

// Create workspace
app.put("/api/workspaces", async (req: Request, res: Response) => {
  console.log("Creating workspace", req.body);
  try {
    const { userId, assignmentId } = req.body;
    const files_map = await getFiles(); // Await the result of getFiles
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
          console.log(file.path);
          let local_filepath = path.join(__dirname, "../../george", file.path); // Adjust the path as necessary
          const fileContent: string = await fs.readFile(local_filepath, "utf8");
          loaded_files.push({
            name: filename,
            path: local_filepath,
            content: fileContent,
          });
          console.log({
            name: filename,
            path: local_filepath,
            content: fileContent,
          });
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
    console.log(`Starting workspace with files: ${files}`);
    const workspace = await createNewWorkspace(
      userId,
      assignmentId,
      loaded_files
    );
    console.log("Finished creating workspace");
    res.json({ workspaceId: workspace.id });
  } catch (error) {
    console.error("Failed to create workspace", error);
    res.status(500).json({ message: "Failed to create workspace", error });
  }
});

// Delete workspace
app.delete("/api/workspaces", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.body;
    const deleted = await deleteWorkspaceById(workspaceId);
    res.json({ message: `Workspace ${deleted.project} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete workspace" });
  }
});

// Invite to workspace
app.post("/api/workspaces/invite", async (req: Request, res: Response) => {
  try {
    const { userId, workspaceId } = req.body;
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
      const { inviteId, accept } = req.body;
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
    const { inviteId } = req.body;
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
      const { userId, workspaceId } = req.body;
      await removeUserFromWorkspace(workspaceId, userId);
      res.json({
        message: `Collaborator ${userId} removed successfully`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  }
);

// Add these routes
app.get("/api/workspaces/:id/users", async (req, res) => {
  try {
    const currentUserId = req.query.userId as string;
    const users = await getWorkspaceUsers(req.params.id, currentUserId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.get("/api/workspaces/:id/invites", async (req, res) => {
  try {
    const invites = await getWorkspaceInvites(req.params.id);
    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch invites" });
  }
});

// Add this route
app.get("/api/workspaces/invites/user/:userId", async (req, res) => {
  try {
    const invites = await getInvitesForUser(req.params.userId);
    res.json(invites);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user invites" });
  }
});

// Start the server
httpServer.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
