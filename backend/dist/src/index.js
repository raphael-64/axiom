"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const socketClient_1 = require("@services/socketClient"); // Adjust the path as needed
const utils_1 = require("./utils/utils");
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const load_files_locally = false;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Create an HTTP server
const httpServer = (0, http_1.createServer)(app);
// Initialize Socket.IO with the HTTP server
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: "*", // Adjust for security if needed
    },
});
const getFiles = () => __awaiter(void 0, void 0, void 0, function* () {
    const files = yield fetch("https://student.cs.uwaterloo.ca/~se212/files.json");
    return yield files.json();
});
const getFile = (filename) => __awaiter(void 0, void 0, void 0, function* () {
    const file = yield fetch(`https://student.cs.uwaterloo.ca/~se212/${filename}`);
    return yield file.json();
});
// Integrate the connection handler with Socket.IO
(0, socketClient_1.handleConnection)(io);
// Express route
app.get("/", (req, res) => {
    res.send("SE212 Server");
});
// Get all workspaces
app.get("/api/workspaces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["user-id"]; // You'll need to pass this from frontend
        const workspaces = yield (0, utils_1.getWorkspacesForUser)(userId);
        res.json({ workspaces });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to fetch workspaces" });
    }
}));
// Create workspace
app.put("/api/workspaces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.headers["user-id"];
        const workspace = yield (0, utils_1.createNewWorkspace)(userId, "New Project");
        //Ian's code below, need to finish
        /* const assignmentId: string = req.params.assignmentId;
        const files_map = await getFiles(); // Await the result of getFiles
        res.send(files_map);
        let files: File[] = [];
        files_map.forEach((assignment: FileMap) => {
          if (assignment.name == assignmentId) {
            files = assignment.files;
          }
        });
        console.log(files);
        // Check if files is not null before iterating
        let loaded_files = [];
        if (files) {
          if (load_files_locally) {
            files.forEach((file: File) => {});
          } else {
            files.forEach((file: File) => {
              let filename = file.name;
              let filepath = file.path;
              let fileContent = await getFile(filepath);
              // continue from here next tiem
            });
          }
        } */
        res.json({ workspaceId: workspace.id });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create workspace" });
    }
}));
// Delete workspace
app.delete("/api/workspaces", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { workspaceId } = JSON.parse(req.body);
        yield (0, utils_1.deleteWorkspaceById)(workspaceId);
        res.json({ message: "Workspace deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete workspace" });
    }
}));
// Invite to workspace
app.post("/api/workspaces/invite", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = JSON.parse(req.body);
        const workspaceId = req.headers["workspace-id"];
        const invite = yield (0, utils_1.createWorkspaceInvite)(workspaceId, userId);
        res.json({ inviteId: invite.id });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to create invite" });
    }
}));
// Accept/decline invite
app.post("/api/workspaces/invite/accept", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { inviteId, accept } = JSON.parse(req.body);
        yield (0, utils_1.handleInviteResponse)(inviteId, accept);
        res.json({
            message: `Invitation ${accept ? "accepted" : "declined"} successfully`,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to process invite response" });
    }
}));
// Delete invite
app.delete("/api/workspaces/invite", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { inviteId } = JSON.parse(req.body);
        yield (0, utils_1.handleInviteResponse)(inviteId, false);
        res.json({ message: "Invitation deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to delete invite" });
    }
}));
// Remove collaborator
app.delete("/api/workspaces/collaborator", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = JSON.parse(req.body);
        const workspaceId = req.headers["workspace-id"];
        yield (0, utils_1.removeUserFromWorkspace)(workspaceId, userId);
        res.json({ message: "Collaborator removed successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Failed to remove collaborator" });
    }
}));
// Start the server
httpServer.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
