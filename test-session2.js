const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
require('dotenv').config();

const config = {
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
}
const adapter = new PrismaLibSQL(config);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const s = await prisma.admin.findFirst();
    console.log("Admin:", s);
  } catch(e) {
    console.error("Error:", e);
  }
}
main();
