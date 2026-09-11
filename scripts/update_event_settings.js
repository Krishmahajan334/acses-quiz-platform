const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEventSettings() {
  const activeEvent = await prisma.quizEvent.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (activeEvent) {
    await prisma.quizEvent.update({
      where: { id: activeEvent.id },
      data: { 
        questionCount: 5,
        durationSec: 120 // 2 minutes
      }
    });
    console.log(`Successfully updated event settings. Questions: 5, Duration: 120s (2 mins)`);
  } else {
    console.log('No active QuizEvent found.');
  }
}

updateEventSettings().catch(console.error).finally(() => prisma.$disconnect());
