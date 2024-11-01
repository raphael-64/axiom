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
Object.defineProperty(exports, "__esModule", { value: true });
exports.greet = void 0;
exports.getWorkspacesForUser = getWorkspacesForUser;
exports.createNewWorkspace = createNewWorkspace;
exports.deleteWorkspaceById = deleteWorkspaceById;
exports.createWorkspaceInvite = createWorkspaceInvite;
exports.handleInviteResponse = handleInviteResponse;
exports.removeUserFromWorkspace = removeUserFromWorkspace;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// src/utils.ts
const greet = (name) => {
    console.log(`Hello, ${name}!`);
    return "hi";
};
exports.greet = greet;
function getWorkspacesForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.workspace.findMany({
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
function createNewWorkspace(userId, project) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.workspace.create({
            data: {
                project,
                users: {
                    connect: { id: userId },
                },
            },
        });
    });
}
function deleteWorkspaceById(workspaceId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.workspace.delete({
            where: { id: workspaceId },
        });
    });
}
function createWorkspaceInvite(workspaceId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.invite.create({
            data: {
                workspaceId,
                userId,
            },
        });
    });
}
function handleInviteResponse(inviteId, accept) {
    return __awaiter(this, void 0, void 0, function* () {
        const invite = yield prisma.invite.findUnique({
            where: { id: inviteId },
            include: { workspace: true },
        });
        if (accept && invite) {
            yield prisma.workspace.update({
                where: { id: invite.workspaceId },
                data: {
                    users: {
                        connect: { id: invite.userId },
                    },
                },
            });
        }
        return yield prisma.invite.delete({
            where: { id: inviteId },
        });
    });
}
function removeUserFromWorkspace(workspaceId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma.workspace.update({
            where: { id: workspaceId },
            data: {
                users: {
                    disconnect: { id: userId },
                },
            },
        });
    });
}
