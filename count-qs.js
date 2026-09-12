const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const counts = await prisma.question.groupBy({
    by: ['targetYear'],
    _count: {
      _all: true,
    },
  });
  console.log(counts);
}
run();
