import prisma from "../prisma";

export async function createFile(
  workspaceId: string,
  path: string,
  name: string,
  content: string
) {
  return await prisma.file.create({
    data: {
      workspaceId,
      path,
      name,
      content,
    },
  });
}

export async function getFileById(fileId: string) {
  return await prisma.file.findUnique({
    where: { id: fileId },
    include: { workspace: true },
  });
}

export async function updateFileContent(fileId: string, newContent: string) {
  return await prisma.file.update({
    where: { id: fileId },
    data: { content: newContent },
  });
}

export async function deleteFile(fileId: string) {
  return await prisma.file.delete({
    where: { id: fileId },
  });
}
