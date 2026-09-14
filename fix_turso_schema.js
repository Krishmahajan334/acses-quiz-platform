const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  try {
    console.log("Applying missing tables to Turso...");
    
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'CO_ADMIN',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Admin table checked.");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS "ScannerSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "adminId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'ACTIVE',
        "lastScan" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    console.log("ScannerSession table checked.");

    try {
      await client.execute(`
        ALTER TABLE "Coupon" ADD COLUMN "redeemedBy" TEXT
      `);
      console.log("Added redeemedBy to Coupon.");
    } catch (e) {
      if (e.message && e.message.includes("duplicate column name")) {
        console.log("Column redeemedBy already exists.");
      } else {
        console.log("Coupon alter error:", e.message);
      }
    }

    console.log("Success! Database schema synced to Turso.");
  } catch (err) {
    console.error("Error applying schema:", err);
  }
}
main();
