import { Server, Socket } from "socket.io";
import * as Y from "yjs";

interface WorkspaceDoc {
  doc: Y.Doc;
  clients: Map<string, string>; // socketId -> userId
}

// Store active workspaces and their documents
const workspaces = new Map<string, Map<string, WorkspaceDoc>>();

export const handleConnection = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) {
      socket.emit("error", "No user ID provided");
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

      // Broadcast to all other clients in same file
      const roomId = `${workspaceId}:${path}`;
      socket.to(roomId).emit(`doc-update-${path}`, update);
    });

    socket.on("leaveRoom", (workspaceId: string) => {
      const workspace = workspaces.get(workspaceId);
      if (!workspace) return;

      // Remove client from all docs in workspace
      for (const [path, docData] of workspace.entries()) {
        if (docData.clients.has(socket.id)) {
          const roomId = `${workspaceId}:${path}`;
          socket.to(roomId).emit("user-left", {
            userId,
            path,
          });
          docData.clients.delete(socket.id);
        }

        // Clean up doc if no clients left
        if (docData.clients.size === 0) {
          workspace.delete(path);
        }
      }

      // Clean up workspace if empty
      if (workspace.size === 0) {
        workspaces.delete(workspaceId);
      }
    });

    socket.on("disconnect", () => {
      // Clean up client from all workspaces
      for (const workspace of workspaces.values()) {
        for (const [path, docData] of workspace.entries()) {
          if (docData.clients.has(socket.id)) {
            docData.clients.delete(socket.id);
            if (docData.clients.size === 0) {
              workspace.delete(path);
            }
          }
        }
      }

      // Clean up empty workspaces
      for (const [workspaceId, workspace] of workspaces.entries()) {
        if (workspace.size === 0) {
          workspaces.delete(workspaceId);
        }
      }
    });
  });
};
