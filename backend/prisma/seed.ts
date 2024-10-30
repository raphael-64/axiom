import prisma from "../src/prisma";

async function main() {
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});

  const user = await prisma.user.create({
    data: { id: "r34agarw" },
  });

  const workspace = await prisma.workspace.create({
    data: {
      project: "Assignment 0",
      users: {
        connect: { id: user.id },
      },
    },
    include: { users: true },
  });

  console.log("Seeding completed");
  console.log("User:", user);
  console.log("Workspace with connected User:", workspace);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
