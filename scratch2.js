const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const diffs = await prisma.question.groupBy({
    by: ['difficulty'],
    _count: {
      difficulty: true,
    },
  });
  console.log("Groups:", diffs);
  const total = await prisma.question.count();
  console.log("Total:", total);
}
main().catch(console.error).finally(() => prisma.$disconnect());
