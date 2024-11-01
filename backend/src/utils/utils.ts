import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// src/utils.ts
export const greet = (name: string): string => {
  console.log(`Hello, ${name}!`);
  return "hi";
};

export async function getWorkspacesForUser(userId: string) {
  return await prisma.workspace.findMany({
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
}

export async function createNewWorkspace(userId: string, project: string, files: { path: string; name: string; content: string }[]) {
  return await prisma.workspace.create({
    data: {
      users: {
        connect: { id: userId }, // Include the existing user in the users array
      },
      project: project,
      files: {
        create: files.map(file => ({
          path: file.path,
          name: file.name,
          content: file.content,
        })),
      },
      invites: { create: [] },
    },
  });
}

export async function deleteWorkspaceById(workspaceId: string) {
  return await prisma.workspace.delete({
    where: { id: workspaceId },
  });
}

export async function createWorkspaceInvite(
  workspaceId: string,
  userId: string
) {
  return await prisma.invite.create({
    data: {
      workspaceId,
      userId,
    },
  });
}

export async function handleInviteResponse(inviteId: string, accept: boolean) {
  const invite = await prisma.invite.findUnique({
    where: { id: inviteId },
    include: { workspace: true },
  });

  if (accept && invite) {
    await prisma.workspace.update({
      where: { id: invite.workspaceId },
      data: {
        users: {
          connect: { id: invite.userId },
        },
      },
    });
  }

  return await prisma.invite.delete({
    where: { id: inviteId },
  });
}

export async function removeUserFromWorkspace(
  workspaceId: string,
  userId: string
) {
  return await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      users: {
        disconnect: { id: userId },
      },
    },
  });
}
