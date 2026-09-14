require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const res = await client.execute(`SELECT id FROM "QuizEvent"`);
  const events = res.rows;

  const years = ['FY', 'SY', 'TY', 'LY'];

  for (const event of events) {
    for (const year of years) {
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
  console.log("Seeded default configs in Turso!");
}

main();
