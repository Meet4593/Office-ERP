const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_pOmdYzs1AVq9@ep-twilight-violet-adyl2pwv.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  await client.connect();

  const res = await client.query("SELECT * FROM \"User\" WHERE email = 'meet17727@gmail.com'");
  console.log('User:', res.rows[0]);

  await client.end();
}

main().catch(console.error);
