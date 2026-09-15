const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const options = await prisma.option.findMany({
    where: {
      text: {
        contains: '3030'
      }
    },
    include: { question: true }
  });

  for (const opt of options) {
    console.log(`Question ID: ${opt.question.id} - Text: ${opt.question.text}`);
    console.log(`  Option: ${opt.text} (Correct: ${opt.isCorrect})`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
