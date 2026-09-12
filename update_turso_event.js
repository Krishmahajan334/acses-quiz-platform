const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  try {
    console.log("Applying event duration to Turso...");
    await client.execute("UPDATE QuizEvent SET durationSec = 120 WHERE status = 'ACTIVE'");
    console.log("Success! Active quiz event duration is now exactly 2 minutes.");
  } catch (err) {
    console.error("Error applying to turso:", err);
  }
}
main();
