import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';
import * as schema from './schema.js';

dotenv.config();

const neonSql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export const db = neonSql ? drizzle(neonSql, { schema }) : null;

// Raw neon client kept only for CREATE TABLE IF NOT EXISTS in migrate.js
export { neonSql };
