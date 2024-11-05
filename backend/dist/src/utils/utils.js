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
exports.debouncedUpdateFile = exports.greet = void 0;
exports.getWorkspacesForUser = getWorkspacesForUser;
exports.createNewWorkspace = createNewWorkspace;
exports.deleteWorkspaceById = deleteWorkspaceById;
exports.createWorkspaceInvite = createWorkspaceInvite;
exports.handleInviteResponse = handleInviteResponse;
exports.removeUserFromWorkspace = removeUserFromWorkspace;
exports.updateFileContent = updateFileContent;
exports.upsertUser = upsertUser;
const prisma_1 = __importDefault(require("../prisma"));
// src/utils.ts
const greet = (name) => {
    console.log(`Hello, ${name}!`);
    return "hi";
};
exports.greet = greet;
function getWorkspacesForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.findMany({
            where: {
                users: {
                    some: {
                        id: userId,
                    },
                },
            },
            include: {
                users: true,
                files: true,
                invites: true,
            },
        });
    });
}
function createNewWorkspace(userId, project, files) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!userId)
            throw new Error("userId is required");
        yield upsertUser(userId);
        return yield prisma_1.default.workspace.create({
            data: {
                users: {
                    connect: { id: userId }, // Include the existing user in the users array
                },
                project: project,
                files: {
                    create: files.map((file) => ({
                        path: file.path,
                        name: file.name,
                        content: file.content,
                    })),
                },
                invites: { create: [] },
            },
        });
    });
}
function deleteWorkspaceById(workspaceId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.delete({
            where: { id: workspaceId },
        });
    });
}
function createWorkspaceInvite(workspaceId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.invite.create({
            data: {
                workspaceId,
                userId,
            },
        });
    });
}
function handleInviteResponse(inviteId, accept) {
    return __awaiter(this, void 0, void 0, function* () {
        const invite = yield prisma_1.default.invite.findUnique({
            where: { id: inviteId },
            include: { workspace: true },
        });
        if (accept && invite) {
            yield prisma_1.default.workspace.update({
                where: { id: invite.workspaceId },
                data: {
                    users: {
                        connect: { id: invite.userId },
                    },
                },
            });
        }
        return yield prisma_1.default.invite.delete({
            where: { id: inviteId },
        });
    });
}
function removeUserFromWorkspace(workspaceId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.update({
            where: { id: workspaceId },
            data: {
                users: {
                    disconnect: { id: userId },
                },
            },
        });
    });
}
function updateFileContent(workspaceId, path, content) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.file.update({
            where: {
                workspaceId_path: {
                    workspaceId,
                    path,
                },
            },
            data: {
                content,
            },
        });
    });
}
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
exports.debouncedUpdateFile = debounce((workspaceId, path, content) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield updateFileContent(workspaceId, path, content);
    }
    catch (error) {
        console.error("Failed to update file in DB:", error);
    }
}), 500);
function upsertUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!userId)
            throw new Error("userId is required");
        return yield prisma_1.default.user.upsert({
            where: { id: userId },
            create: { id: userId },
            update: {},
        });
    });
}
