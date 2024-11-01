import { Server, Socket } from "socket.io";
import * as Y from "yjs";

// Store active workspaces and their documents
const workspaces = new Map<
  string,
  Map<string, { doc: Y.Doc; clients: Set<string> }>
>();

export const handleConnection = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`New connection: ${socket.id}`);

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
          clients: new Set(),
        });
      }

      const docData = workspace.get(path)!;
      docData.clients.add(socket.id);

      // Send current document state to new client
      const update = Y.encodeStateAsUpdate(docData.doc);
      socket.emit("sync", {
        path,
        update: Buffer.from(update).toString("base64"),
      });
    });

    socket.on("doc-update", ({ workspaceId, path, update }) => {
      const workspace = workspaces.get(workspaceId);
      if (!workspace) return;

      const docData = workspace.get(path);
      if (!docData) return;

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
        docData.clients.delete(socket.id);

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
          docData.clients.delete(socket.id);
          if (docData.clients.size === 0) {
            workspace.delete(path);
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
