const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const questions = await prisma.question.findMany({
    include: { options: true }
  });

  let duplicateCount = 0;
  for (const q of questions) {
    const seen = new Set();
    let hasDuplicate = false;
    for (const opt of q.options) {
      if (seen.has(opt.text)) {
        hasDuplicate = true;
      }
      seen.add(opt.text);
    }
    if (hasDuplicate) {
      console.log(`Question ID: ${q.id} - Text: ${q.text}`);
      for (const opt of q.options) {
         console.log(`  Option: ${opt.text} (Correct: ${opt.isCorrect})`);
      }
      duplicateCount++;
    }
  }
  console.log(`Found ${duplicateCount} questions with duplicate options.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
