import { db } from './src/backend/db/connection.js';
import { command_profiles, users } from './src/backend/db/schema.js';

async function check() {
  if (!db) {
    console.log("No db connection");
    process.exit(1);
  }
  const profiles = await db.select().from(command_profiles);
  console.log("Command Profiles in DB:", JSON.stringify(profiles, null, 2));

  const allUsers = await db.select().from(users);
  console.log("Users in DB:", JSON.stringify(allUsers, null, 2));

  process.exit(0);
}
check();
