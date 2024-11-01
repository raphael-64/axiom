import { Server, Socket } from "socket.io";
import * as Y from "yjs";

import prisma from "./prisma";
import { debouncedUpdateFile } from "@utils/utils";

interface WorkspaceDoc {
  doc: Y.Doc;
  clients: Map<string, string>;
}

const workspaces = new Map<string, Map<string, WorkspaceDoc>>();

export const handleConnection = (io: Server) => {
  io.on("connection", async (socket: Socket) => {
    const userId = socket.handshake.auth.userId;
    const workspaceId = socket.handshake.auth.workspaceId;

    if (!(await checkUserAccess(userId, workspaceId))) {
      socket.emit("error", "Unauthorized access to workspace");
      socket.disconnect();
      return;
    }

    console.log(`New connection: ${socket.id} (User: ${userId})`);

    socket.on("joinRoom", ({ workspaceId, path }) => {
      const roomId = `${workspaceId}:${path}`;
      socket.join(roomId);

      if (!workspaces.has(workspaceId)) {
        workspaces.set(workspaceId, new Map());
      }

      const workspace = workspaces.get(workspaceId)!;

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
      const workspaceId = socket.handshake.auth.workspaceId;
      const workspace = workspaces.get(workspaceId);
      if (!workspace) return;

      for (const [path, docData] of workspace.entries()) {
        if (docData.clients.has(socket.id)) {
          const roomId = `${workspaceId}:${path}`;
          socket.to(roomId).emit("user-left", {
            userId,
            path,
          });
          docData.clients.delete(socket.id);

          const saveOnLeave = true;
          if (saveOnLeave) {
            const content = docData.doc.getText("content").toString();
            debouncedUpdateFile(workspaceId, path, content);
          }

          if (docData.clients.size === 0) {
            workspace.delete(path);
          }
          break;
        }
      }

      if (workspace.size === 0) {
        workspaces.delete(workspaceId);
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
