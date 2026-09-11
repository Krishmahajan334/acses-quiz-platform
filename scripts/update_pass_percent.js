const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePassPercent() {
  const activeEvent = await prisma.quizEvent.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (activeEvent) {
    await prisma.quizEvent.update({
      where: { id: activeEvent.id },
      data: { passPercent: 80 }
    });
    console.log(`Successfully updated passPercent to 80 for event: ${activeEvent.name}`);
  } else {
    console.log('No active QuizEvent found.');
  }
}

updatePassPercent().catch(console.error).finally(() => prisma.$disconnect());
