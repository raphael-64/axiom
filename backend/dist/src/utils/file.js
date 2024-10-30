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
exports.createFile = createFile;
exports.getFileById = getFileById;
exports.updateFileContent = updateFileContent;
exports.deleteFile = deleteFile;
const prisma_1 = __importDefault(require("../prisma"));
function createFile(workspaceId, path, name, content) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.file.create({
            data: {
                workspaceId,
                path,
                name,
                content,
            },
        });
    });
}
function getFileById(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.file.findUnique({
            where: { id: fileId },
            include: { workspace: true },
        });
    });
}
function updateFileContent(fileId, newContent) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.file.update({
            where: { id: fileId },
            data: { content: newContent },
        });
    });
}
function deleteFile(fileId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.file.delete({
            where: { id: fileId },
        });
    });
}
