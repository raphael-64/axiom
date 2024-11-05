import { Server, Socket } from "socket.io";
import * as Y from "yjs";

import prisma from "./prisma";
import { debouncedUpdateFile } from "@utils/utils";

// Data structure for a workspace
interface Workspace {
  doc: Map<string, Y.Doc>;
  clients: Map<string, string>;
}

// Map of all workspaces
const workspaces = new Map<string, Workspace>();

export const handleConnection = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      socket.emit("error", "No user ID provided");
      socket.disconnect();
      return;
    }

    console.log(`New connection: ${socket.id} (User: ${userId})`);

    socket.on("joinRoom", async ({ workspaceId }) => {
      console.log("joinRoom", workspaceId);
      // Check if user has permission to access this workspace
      if (!(await checkUserAccess(userId, workspaceId))) {
        socket.emit("error", "Unauthorized access to workspace");
        return;
      }

      // Create new workspace data structure if it doesn't exist
      if (!workspaces.has(workspaceId)) {
        workspaces.set(workspaceId, { doc: new Map(), clients: new Map() });
      }

      // Get workspace and add client
      const workspace = workspaces.get(workspaceId)!;
      workspace.clients.set(socket.id, userId);

      // Join socket.io room for this workspace
      const roomId = `${workspaceId}`;
      socket.join(roomId);

      // Get workspace files from database
      const workspaceFiles = await prisma.file.findMany({
        where: { workspaceId },
      });

      // Create Y.Doc for each file if needed
      for (const file of workspaceFiles) {
        if (!workspace.doc.has(file.path)) {
          const doc = new Y.Doc();
          // Initialize doc with content from DB
          const ytext = doc.getText("content");
          ytext.insert(0, file.content);
          workspace.doc.set(file.path, doc);
        }

        // Get Y.Doc instance for this file
        const docData = workspace.doc.get(file.path)!;

        // Send current document state to new client
        const update = Y.encodeStateAsUpdate(docData);
        socket.emit("sync", {
          path: file.path,
          update: Buffer.from(update).toString("base64"),
        });

        // Notify other clients that a new user joined
        socket.to(roomId).emit("user-joined", {
          userId,
          path: file.path,
        });
      }
    });

    socket.on("leaveRoom", ({ workspaceId }) => {
      console.log("leaveRoom", workspaceId);
      socket.leave(workspaceId);
      handleLeaveRoom(socket, workspaceId, userId);
    });

    // Handle document updates from clients
    socket.on("doc-update", ({ workspaceId, path, update }) => {
      // Get the workspace data structure
      const workspace = workspaces.get(workspaceId);
      if (!workspace) return;

      // Get the Y.Doc for this file path
      const docData = workspace.doc.get(path);
      if (!docData) return;

      // Convert base64 update to binary and apply to Y.Doc
      const binaryUpdate = Buffer.from(update, "base64");
      Y.applyUpdate(docData, binaryUpdate);

      // Get the current document content and save to disk
      const content = docData.getText("content").toString();
      debouncedUpdateFile(workspaceId, path, content);

      // Broadcast update to all other clients in the room
      const roomId = `${workspaceId}:${path}`;
      socket.to(roomId).emit(`doc-update-${path}`, update);
    });

    socket.on("disconnect", async () => {
      // Find workspace ID from room
      const workspaceId = Array.from(socket.rooms).find((room) =>
        workspaces.has(room)
      );
      // Delete client from workspace
      if (workspaceId && workspaces.has(workspaceId)) {
        handleLeaveRoom(socket, workspaceId, userId);
      }
    });
  });
};

async function checkUserAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const workspace = await prisma.workspace.findFirst({
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
}

async function handleLeaveRoom(
  socket: Socket,
  workspaceId: string,
  userId: string
) {
  const workspace = workspaces.get(workspaceId);
  if (!workspace) return;

  workspace.clients.delete(socket.id);

  // Notify others that user left
  socket.to(workspaceId).emit("user-left", {
    userId,
  });

  // Delete workspace in memory if no connected clients left
  if (workspace.clients.size === 0) {
    workspace.doc.forEach((doc, path) => {
      workspace.doc.delete(path);
    });

    workspaces.delete(workspaceId); // Delete workspace in memory
  }
}
