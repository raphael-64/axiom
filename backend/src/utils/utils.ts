import prisma from "../prisma";

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

export async function createNewWorkspace(
  userId: string,
  project: string,
  files: { path: string; name: string; content: string }[]
) {
  if (!userId) throw new Error("userId is required");

  await upsertUser(userId);

  return await prisma.workspace.create({
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

export async function updateFileContent(
  workspaceId: string,
  path: string,
  content: string
) {
  return await prisma.file.update({
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
}

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const debouncedUpdateFile = debounce(
  async (workspaceId: string, path: string, content: string) => {
    try {
      await updateFileContent(workspaceId, path, content);
    } catch (error) {
      console.error("Failed to update file in DB:", error);
    }
  },
  500
);

export async function upsertUser(userId: string) {
  if (!userId) throw new Error("userId is required");

  return await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId },
    update: {},
  });
}

export async function getWorkspaceUsers(
  workspaceId: string,
  currentUserId: string
) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: { users: true },
  });
  return workspace?.users.filter((user) => user.id !== currentUserId) || [];
}

export async function getWorkspaceInvites(workspaceId: string) {
  return await prisma.invite.findMany({
    where: { workspaceId },
    include: { user: true },
  });
}

export async function getInvitesForUser(userId: string) {
  return await prisma.invite.findMany({
    where: { userId },
    include: {
      workspace: {
        include: {
          users: true,
        },
      },
    },
  });
}
