const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  try {
    const res = await client.execute("SELECT * FROM \"Admin\" WHERE username = 'admin'");
    if (res.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const uuid = require('crypto').randomUUID();
      await client.execute({
        sql: 'INSERT INTO "Admin" (id, username, password, role) VALUES (?, ?, ?, ?)',
        args: [uuid, 'admin', hashedPassword, 'SUPER_ADMIN']
      });
      console.log("Super admin created! username: admin, password: admin123");
    } else {
      console.log("Admin already exists!");
    }
  } catch (err) {
    console.error("Error seeding admin:", err);
  }
}
main();
