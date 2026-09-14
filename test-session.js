const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const s = await prisma.scannerSession.create({
      data: { adminId: "test_admin" }
    });
    console.log("Created", s.id);
  } catch(e) {
    console.error("Error:", e);
  }
}
main();
