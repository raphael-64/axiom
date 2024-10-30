import prisma from '../src/prisma';

async function main() {
  await prisma.user.create({
    data: { id: "r34agarw" },
  });

  console.log("Seeding completed");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
