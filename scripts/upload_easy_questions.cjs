const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log("Reading JSON file...");
  const data = JSON.parse(fs.readFileSync('public/easy_questions_seed.json', 'utf8'));
  
  const activeEvent = await prisma.quizEvent.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!activeEvent) {
    throw new Error("No active event found!");
  }

  console.log(`Uploading ${data.length} questions to Turso...`);
  
  let added = 0;
  // Doing it in chunks to not overwhelm memory
  for (let i = 0; i < data.length; i += 25) {
    const chunk = data.slice(i, i + 25);
    
    await prisma.$transaction(async (tx) => {
      for (const q of chunk) {
        const newQuestion = await tx.question.create({
          data: {
            eventId: activeEvent.id,
            text: q.text,
            topic: q.topic,
            difficulty: q.difficulty,
            targetYear: q.targetYear || "ALL",
            durationSec: q.timeLimitSec ? parseInt(q.timeLimitSec) : null,
          }
        });

        const optionsData = q.options.map((opt) => ({
          questionId: newQuestion.id,
          text: opt.text,
          optionKey: opt.optionKey,
          isCorrect: Boolean(opt.isCorrect)
        }));

        await tx.option.createMany({ data: optionsData });
        added++;
      }
    }, { maxWait: 20000, timeout: 60000 });
    console.log(`Inserted ${added}/${data.length}...`);
  }
  
  console.log("Success! All questions uploaded to live database.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect().then(() => process.exit(0)));
