const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const questions = await prisma.question.findMany({
    where: {
      text: {
        contains: '10 + 20'
      }
    },
    include: { options: true }
  });

  for (const q of questions) {
    console.log(`Question ID: ${q.id} - Text: ${q.text}`);
    for (const opt of q.options) {
       console.log(`  Option: ${opt.text} (Correct: ${opt.isCorrect})`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
