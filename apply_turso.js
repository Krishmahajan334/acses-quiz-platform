const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  try {
    console.log("Applying schema to Turso...");
    
    // Create UploadHistory table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "UploadHistory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "filename" TEXT NOT NULL,
        "questionCount" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("UploadHistory table created.");

    // Add uploadBatchId to Question table
    try {
      await client.execute(`
        ALTER TABLE "Question" ADD COLUMN "uploadBatchId" TEXT
      `);
      console.log("Added uploadBatchId to Question.");
    } catch (e) {
      if (e.message.includes("duplicate column name")) {
        console.log("Column uploadBatchId already exists.");
      } else {
        throw e;
      }
    }
    
    // Add foreign key mapping if necessary (SQLite alter table doesn't support adding FK constraints easily, 
    // but Prisma mostly relies on app-level relations if not enforced strictly in SQLite)

    console.log("Success!");
  } catch (err) {
    console.error("Error applying schema:", err);
  }
}
main();
