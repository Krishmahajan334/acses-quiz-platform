const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const diffs = await prisma.question.groupBy({
    by: ['difficulty'],
    _count: {
      difficulty: true,
    },
  });
  console.log(diffs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
