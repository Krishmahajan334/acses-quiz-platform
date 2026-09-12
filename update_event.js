const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const updated = await prisma.quizEvent.updateMany({
      where: { status: 'ACTIVE' },
      data: { durationSec: 120 }
    });
    console.log(`Updated ${updated.count} local active events to 120s.`);
  } catch (e) {
    console.error("Local DB update error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
