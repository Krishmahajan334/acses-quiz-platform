const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  const allQuestions = await prisma.question.findMany();
  let updatedCount = 0;

  for (const q of allQuestions) {
    let newText = q.text;

    // Remove suffix (Variation X) or (Case Y)
    newText = newText.replace(/\s\((Variation|Case)\s\d+\)/g, '');
    
    // Remove prefix "Basic Computer Science Question Variation #X: "
    newText = newText.replace(/^Basic Computer Science Question Variation #\d+:\s/g, '');

    if (newText !== q.text) {
      await prisma.question.update({
        where: { id: q.id },
        data: { text: newText }
      });
      updatedCount++;
    }
  }

  console.log(`Cleaned up ${updatedCount} questions in the database.`);
}

clean().catch(console.error).finally(() => prisma.$disconnect());
