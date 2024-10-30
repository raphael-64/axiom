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
exports.createWorkspace = createWorkspace;
exports.getWorkspaceById = getWorkspaceById;
exports.updateWorkspace = updateWorkspace;
exports.deleteWorkspace = deleteWorkspace;
exports.addUserToWorkspace = addUserToWorkspace;
const prisma_1 = __importDefault(require("../prisma"));
function createWorkspace(project, userIds) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.create({
            data: {
                project,
                users: {
                    connect: userIds.map((id) => ({ id })),
                },
            },
            include: { users: true },
        });
    });
}
function getWorkspaceById(workspaceId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.findUnique({
            where: { id: workspaceId },
            include: { users: true, files: true },
        });
    });
}
function updateWorkspace(workspaceId, newProjectName) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.update({
            where: { id: workspaceId },
            data: { project: newProjectName },
        });
    });
}
function deleteWorkspace(workspaceId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.delete({
            where: { id: workspaceId },
        });
    });
}
function addUserToWorkspace(workspaceId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.workspace.update({
            where: { id: workspaceId },
            data: {
                users: {
                    connect: { id: userId },
                },
            },
            include: { users: true },
        });
    });
}
