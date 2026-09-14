const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const event = await prisma.quizEvent.findFirst({ where: { status: 'ACTIVE' } });
  console.log("Active Event:", event);
}
main().catch(console.error).finally(() => prisma.$disconnect());
