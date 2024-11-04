import { Server, Socket } from "socket.io";
import * as Y from "yjs";

import prisma from "./prisma";
import { debouncedUpdateFile } from "@utils/utils";

interface Workspace {
  doc: Map<string, Y.Doc>;
  clients: Map<string, string>;
}

const workspaces = new Map<string, Workspace>();

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

    if (!workspaces.has(workspaceId)) {
      workspaces.set(workspaceId, { doc: new Map(), clients: new Map() });
    }

    const workspace = workspaces.get(workspaceId)!;
    workspace.clients.set(socket.id, userId);

    socket.on("joinRoom", ({ workspaceId, path }) => {
      const roomId = `${workspaceId}:${path}`;
      socket.join(roomId);

      if (!workspace.doc.has(path)) {
        workspace.doc.set(path, new Y.Doc());
      }

      const docData = workspace.doc.get(path)!;

      // Send current document state to new client
      const update = Y.encodeStateAsUpdate(docData);
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
      if (!workspace) return;

      const docData = workspace.doc.get(path);
      if (!docData) return;

      const binaryUpdate = Buffer.from(update, "base64");
      Y.applyUpdate(docData, binaryUpdate);

      const content = docData.getText("content").toString();
      debouncedUpdateFile(workspaceId, path, content);

      const roomId = `${workspaceId}:${path}`;
      socket.to(roomId).emit(`doc-update-${path}`, update);
    });

    socket.on("disconnect", async () => {
      if (workspace) {
        workspace.clients.delete(socket.id);

        socket.to(workspaceId).emit("user-left", {
          userId,
        });

        if (workspace.clients.size === 0) {
          workspace.doc.forEach((doc, path) => {
            workspace.doc.delete(path);
          });

          workspaces.delete(workspaceId);
          await prisma.workspace.delete({
            where: { id: workspaceId },
          });
        }
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
