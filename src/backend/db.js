import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

export const sql = neon(process.env.DATABASE_URL);


export const initDb = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            console.warn("⚠️ DATABASE_URL not found. Neon DB integration disabled.");
            return;
        }

        console.log("Initializing Neon DB tables...");
        // Reset incidents table for clean schema (Dev Mode)
        await sql`DROP TABLE IF EXISTS incidents`;

        // Incidents Table
        await sql`
            CREATE TABLE incidents (
                id SERIAL PRIMARY KEY,
                description TEXT,
                status TEXT DEFAULT 'ANALYZING',
                last_agent TEXT DEFAULT 'SENTINEL',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;


        // Users Table for Auth
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nic_number TEXT UNIQUE NOT NULL,
                name TEXT,
                sector TEXT,
                password TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log("✅ Neon DB tables ready.");
    } catch (error) {
        console.error("❌ Database Initialization Error:", error);
    }
};

/**
 * Auth Helpers
 */
export const createUser = async (user) => {
    if (!sql) return;
    return await sql`
        INSERT INTO users (nic_number, name, sector, password)
        VALUES (${user.nic}, ${user.name}, ${user.sector}, ${user.password})
        RETURNING id, nic_number, name, sector
    `;
};

export const findUserByNic = async (nic) => {
    if (!sql) return null;
    const users = await sql`SELECT * FROM users WHERE nic_number = ${nic}`;
    return users[0];
};

export const saveIncident = async (state) => {
    if (!sql) return;
    console.log("[Neon DB] Persisting incident state...");
    try {
        await sql`
            INSERT INTO incidents (incident_id, location, type, severity, status, data)
            VALUES (${state.incident_id}, ${state.location}, ${state.type}, ${state.severity}, ${state.status}, ${JSON.stringify(state)})
            ON CONFLICT (incident_id) DO UPDATE 
            SET status = EXCLUDED.status, data = EXCLUDED.data
        `;
        console.log(`[Neon DB] Incident ${state.incident_id || 'UNKNOWN'} saved successfully!`);
    } catch (error) {
        console.error("❌ Error saving incident:", error);
    }
    return true;
};
