const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_pOmdYzs1AVq9@ep-twilight-violet-adyl2pwv.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
  });

  await client.connect();

  // Set a default security question on the admin account
  // Answer will be "meet" (lowercase) - user can change it later
  const res = await client.query(
    `UPDATE "User" SET "securityQuestion" = 'What is your favorite food?', "securityAnswer" = 'meet' WHERE email = 'meet17727@gmail.com' RETURNING id, email, "securityQuestion"`
  );
  console.log('Updated user:', res.rows[0]);

  await client.end();
}

main().catch(console.error);
