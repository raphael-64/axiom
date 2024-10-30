import { Server } from "socket.io";
import * as Y from "yjs";

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const workspaces = new Map<string, Map<string, Y.Doc>>();

io.on("connection", (socket) => {
  /* 






  Stuff that might be important (begin) 
  */

  socket.on("joinRoom", ({ workspaceId, path }) => {
    socket.join(workspaceId);

    if (!workspaces.has(workspaceId)) {
      workspaces.set(workspaceId, new Map());
    }

    const workspace = workspaces.get(workspaceId)!;
    if (!workspace.has(path)) {
      workspace.set(path, new Y.Doc());
    }
  });

  socket.on("doc-update", ({ workspaceId, path, update }) => {
    socket.to(workspaceId).emit(`doc-update-${path}`, update);
  });

  /* 
  Stuff that might be important (end)





  */

  socket.on("leaveRoom", (workspaceId) => {
    socket.leave(workspaceId);
  });

  socket.on("disconnect", () => {
    // Clean up if needed
  });
});
