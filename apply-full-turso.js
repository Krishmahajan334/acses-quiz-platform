const { createClient } = require('@libsql/client');
const fs = require('fs');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  try {
    const sql = fs.readFileSync('full_schema.sql', 'utf8');
    // executeMultiple can run multiple statements separated by semicolons
    console.log("Applying full schema to Turso...");
    await client.executeMultiple(sql);
    console.log("Success! Database schema synced to Turso.");
  } catch (err) {
    console.error("Error applying schema:", err);
  }
}
main();
