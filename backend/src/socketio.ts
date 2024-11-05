import { Server, Socket } from "socket.io";
import * as Y from "yjs";

import prisma from "./prisma";
import { debouncedUpdateFile } from "@utils/utils";

// Data structure for a workspace
interface Workspace {
  docs: Map<
    string,
    {
      yDoc: Y.Doc;
      content: string;
      lastSaved: number;
    }
  >;
  clients: Set<string>;
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

    socket.on("joinRoom", async ({ workspaceId, path }) => {
      console.log("joinRoom", workspaceId);
      // Check if user has permission to access this workspace
      if (!(await checkUserAccess(userId, workspaceId))) {
        socket.emit("error", "Unauthorized access");
        return;
      }

      // Initialize workspace if needed
      if (!workspaces.has(workspaceId)) {
        workspaces.set(workspaceId, {
          docs: new Map(),
          clients: new Set(),
        });
      }

      const workspace = workspaces.get(workspaceId)!;
      workspace.clients.add(socket.id);
      socket.join(workspaceId);

      // Only load requested file
      if (!workspace.docs.has(path)) {
        const file = await prisma.file.findFirst({
          where: { workspaceId, path },
        });

        if (!file) {
          socket.emit("error", "File not found");
          return;
        }

        const yDoc = new Y.Doc();
        const ytext = yDoc.getText("content");
        ytext.insert(0, file.content);

        workspace.docs.set(path, {
          yDoc,
          content: file.content,
          lastSaved: Date.now(),
        });
      }

      // Send current doc state
      const docData = workspace.docs.get(path)!;
      const update = Y.encodeStateAsUpdate(docData.yDoc);
      socket.emit("sync", Buffer.from(update).toString("base64"));
    });

    socket.on("leaveRoom", ({ workspaceId }) => {
      console.log("leaveRoom", workspaceId);
      socket.leave(workspaceId);
      handleLeaveRoom(socket, workspaceId, userId);
    });

    // Handle document updates from clients
    socket.on("doc-update", ({ workspaceId, path, update }) => {
      const workspace = workspaces.get(workspaceId);
      if (!workspace?.docs.has(path)) return;

      const docData = workspace.docs.get(path)!;
      const binaryUpdate = Buffer.from(update, "base64");

      Y.applyUpdate(docData.yDoc, binaryUpdate);
      const newContent = docData.yDoc.getText("content").toString();

      // Only save if content actually changed
      if (newContent !== docData.content) {
        docData.content = newContent;
        docData.lastSaved = Date.now();
        console.log("saving file", workspaceId, path, newContent);
        debouncedUpdateFile(workspaceId, path, newContent);
      }

      socket.to(workspaceId).emit(`doc-update-${path}`, update);
    });

    socket.on("requestFileContent", ({ workspaceId, path }) => {
      const workspace = workspaces.get(workspaceId);
      if (!workspace) return;

      const docData = workspace.docs.get(path);
      if (!docData) return;

      const content = docData.yDoc.getText("content").toString();
      socket.emit("fileContent", {
        path,
        content,
      });
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
    workspace.docs.forEach((doc, path) => {
      workspace.docs.delete(path);
    });

    workspaces.delete(workspaceId); // Delete workspace in memory
  }
}
