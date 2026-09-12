const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const years = await prisma.question.groupBy({
    by: ['targetYear'],
    _count: {
      targetYear: true,
    },
  });
  console.log(years);
}

main().finally(() => prisma.$disconnect());
