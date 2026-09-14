require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log("Creating EventYearConfig table in Turso...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "EventYearConfig" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "eventId" TEXT NOT NULL,
          "year" TEXT NOT NULL,
          "easyCount" INTEGER NOT NULL DEFAULT 2,
          "mediumCount" INTEGER NOT NULL DEFAULT 2,
          "hardCount" INTEGER NOT NULL DEFAULT 1,
          "excludedTopics" TEXT NOT NULL DEFAULT '',
          CONSTRAINT "EventYearConfig_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "QuizEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    
    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS "EventYearConfig_eventId_year_key" ON "EventYearConfig"("eventId", "year");
    `);

    // We also need to remove the columns from QuizEvent if they exist (Turso SQLite doesn't support DROP COLUMN easily before 3.35, but it does support it now, we can try to drop if they exist, or just leave them). Let's leave them.

    console.log("Successfully updated schema!");
  } catch (error) {
    console.error("Error executing query:", error);
  }
}

main();
