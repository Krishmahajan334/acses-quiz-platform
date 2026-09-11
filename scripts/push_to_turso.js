const fs = require('fs');
const { createClient } = require('@libsql/client');

async function main() {
  console.log("Connecting to Turso...");
  const client = createClient({
    url: 'libsql://acses-quiz-krishmahajan334.aws-ap-northeast-1.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODkxNTUxOTEsImlkIjoiMDFhMDkxZjUtODIwMS03MWU0LTkxMjEtNTEwYzM1ZWY5N2UyIiwia2lkIjoiNkZFQjY4QzU4SUpuNEFLcGpvYlpHUmk2bWxrejZoNjdBUVdfTnRiUDUzayIsInJpZCI6IjgyNzBjNTQ5LTUzYWUtNDEzOC1hYzg5LTU2OTIxZTNiNjNkMiJ9.0jqSDn5ZCqCJc61UdmPZQqD1p8jYR_8m8U41FmbPPADmPN-134VTJ1FXBLty_ZcPThKVDZyVo5OH8WOCbltNDQ'
  });

  const sql = fs.readFileSync('migration.sql', 'utf8');
  const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);

  console.log(`Executing ${statements.length} statements...`);
  
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      console.error("Failed to execute statement:", stmt);
      console.error(e);
      throw e;
    }
  }

  console.log("Schema pushed successfully!");
}

main().catch(console.error);
