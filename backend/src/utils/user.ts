import prisma from "../prisma";

export async function createUser(userId: string) {
  return await prisma.user.create({
    data: {
      id: userId,
    },
  });
}

export async function getUserById(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: { workspaces: true },
  });
}

export async function getAllUsers() {
  return await prisma.user.findMany({
    include: { workspaces: true },
  });
}
