import prisma from "../prisma";

export async function createWorkspace(project: string, userIds: string[]) {
  return await prisma.workspace.create({
    data: {
      project,
      users: {
        connect: userIds.map((id) => ({ id })),
      },
    },
    include: { users: true },
  });
}

export async function getWorkspaceById(workspaceId: string) {
  return await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { users: true, files: true },
  });
}

export async function updateWorkspace(
  workspaceId: string,
  newProjectName: string
) {
  return await prisma.workspace.update({
    where: { id: workspaceId },
    data: { project: newProjectName },
  });
}

export async function deleteWorkspace(workspaceId: string) {
  return await prisma.workspace.delete({
    where: { id: workspaceId },
  });
}

export async function addUserToWorkspace(workspaceId: string, userId: string) {
  return await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      users: {
        connect: { id: userId },
      },
    },
    include: { users: true },
  });
}