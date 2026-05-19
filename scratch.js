import { db } from './src/backend/db/connection.js';
import { incidents } from './src/backend/db/schema.js';
import { sql } from 'drizzle-orm';
async function count() {
  const result = await db.select({ count: sql`count(*)` }).from(incidents);
  console.log("Total incidents in DB:", result[0].count);
  process.exit(0);
}
count();
