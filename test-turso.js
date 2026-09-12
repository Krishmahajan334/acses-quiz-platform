const { createClient } = require('@libsql/client');
require('dotenv').config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  const rs = await client.execute("SELECT name, email FROM Participant WHERE email = 'krishmahajan334@gmail.com'");
  console.log(rs.rows);
}
main();
