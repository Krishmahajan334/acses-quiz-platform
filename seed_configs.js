const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient(); // Connects to dev.db locally
const { createClient } = require('@libsql/client');

async function main() {
  const events = await prisma.quizEvent.findMany();
  
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const years = ['FY', 'SY', 'TY', 'LY'];

  for (const event of events) {
    for (const year of years) {
      // Local
      await prisma.eventYearConfig.upsert({
        where: { eventId_year: { eventId: event.id, year } },
        update: {},
        create: {
          eventId: event.id,
          year,
          easyCount: 2,
          mediumCount: 2,
          hardCount: 1,
          excludedTopics: ''
        }
      });
      
      // Turso
      try {
        const id = require('crypto').randomUUID();
        await client.execute({
          sql: `INSERT OR IGNORE INTO "EventYearConfig" (id, eventId, year, easyCount, mediumCount, hardCount, excludedTopics) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [id, event.id, year, 2, 2, 1, '']
        });
      } catch (e) {
        console.error("Turso error:", e);
      }
    }
  }
  console.log("Seeded default configs!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
