import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
import { debouncedUpdateFile } from "./utils/utils";

interface WorkspaceDoc {
  doc: Y.Doc;
  clients: Map<string, string>; // socketId -> userId
}

// Store active workspaces and their documents
const workspaces = new Map<string, Map<string, WorkspaceDoc>>();

export const handleConnection = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth.userId;

    if (!(await checkUserIdInDatabase(userId))) {
      socket.emit("error", "Invalid user ID provided");
      socket.disconnect();
      return;
    }

    console.log(`New connection: ${socket.id} (User: ${userId})`);

    socket.on("joinRoom", ({ workspaceId, path }) => {
      const roomId = `${workspaceId}:${path}`;
      socket.join(roomId);

      // Initialize workspace if needed
      if (!workspaces.has(workspaceId)) {
        workspaces.set(workspaceId, new Map());
      }

      const workspace = workspaces.get(workspaceId)!;

      // Initialize document if needed
      if (!workspace.has(path)) {
        workspace.set(path, {
          doc: new Y.Doc(),
          clients: new Map(),
        });
      }

      const docData = workspace.get(path)!;
      docData.clients.set(socket.id, userId);

      // Send current document state to new client
      const update = Y.encodeStateAsUpdate(docData.doc);
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
      const workspace = workspaces.get(workspaceId);
      if (!workspace) return;

      const docData = workspace.get(path);
      if (!docData) return;

      // Verify user is in workspace
      if (!docData.clients.has(socket.id)) {
        socket.emit("error", "Not authorized to edit this document");
        return;
      }

      // Apply update to server's doc
      const binaryUpdate = Buffer.from(update, "base64");
      Y.applyUpdate(docData.doc, binaryUpdate);

      // Get the current content and debounce DB update
      const content = docData.doc.getText("content").toString();
      debouncedUpdateFile(workspaceId, path, content);

      // Broadcast to all other clients in same file
      const roomId = `${workspaceId}:${path}`;
      socket.to(roomId).emit(`doc-update-${path}`, update);
    });

    socket.on("disconnect", () => {
      // Find and clean up the workspace/doc this socket was connected to
      for (const [workspaceId, workspace] of workspaces.entries()) {
        for (const [path, docData] of workspace.entries()) {
          if (docData.clients.has(socket.id)) {
            const roomId = `${workspaceId}:${path}`;
            socket.to(roomId).emit("user-left", {
              userId,
              path,
            });
            docData.clients.delete(socket.id);

            // Clean up doc if no clients left
            if (docData.clients.size === 0) {
              workspace.delete(path);
            }
          }
        }
        // Clean up workspace if empty
        if (workspace.size === 0) {
          workspaces.delete(workspaceId);
        }
      }
    });
  });
};

// Mock function to simulate database check
async function checkUserIdInDatabase(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  return user !== null;
}
