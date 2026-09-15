import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("Missing Turso credentials");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function sync() {
  try {
    console.log("Creating SystemSetting table if it doesn't exist...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
          "key" TEXT NOT NULL PRIMARY KEY,
          "value" TEXT NOT NULL
      );
    `);
    console.log("Table SystemSetting ensured.");

    console.log("Creating Attempt index...");
    await client.execute(`
      CREATE INDEX IF NOT EXISTS "Attempt_eventId_scorePercent_idx" 
      ON "Attempt"("eventId", "scorePercent");
    `);
    console.log("Index Attempt_eventId_scorePercent_idx ensured.");
    
    console.log("Turso database sync complete!");
  } catch (error) {
    console.error("Error syncing Turso:", error);
  } finally {
    client.close();
  }
}

sync();
