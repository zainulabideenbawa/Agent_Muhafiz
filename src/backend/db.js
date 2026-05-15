import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Neon Database Connection
 * Use the DATABASE_URL from your Neon Dashboard.
 */
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

if (!sql) {
    console.warn("⚠️  DATABASE_URL not found in .env. Neon DB integration is disabled.");
}

/**
 * Initializes the database tables if they don't exist.
 */
export const initDb = async () => {
    if (!sql) return;
    try {
        console.log("Initializing Neon DB tables...");
        await sql`
            CREATE TABLE IF NOT EXISTS incidents (
                id SERIAL PRIMARY KEY,
                incident_id TEXT UNIQUE NOT NULL,
                location TEXT,
                type TEXT,
                severity TEXT,
                status TEXT,
                data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log("✅ Neon DB tables ready.");
    } catch (error) {
        console.error("❌ Database Initialization Error:", error);
    }
};

/**
 * Persists an incident state to Neon.
 */
export const saveIncident = async (incident) => {
    if (!sql) return;
    try {
        const { incident_id, classification, impact_analysis, metadata } = incident;
        
        await sql`
            INSERT INTO incidents (incident_id, location, type, severity, status, data)
            VALUES (
                ${incident_id}, 
                ${classification?.location?.landmark || 'Unknown'}, 
                ${classification?.type || 'Unknown'}, 
                ${impact_analysis?.severity || 'Medium'}, 
                ${metadata?.current_status || 'active'}, 
                ${JSON.stringify(incident)}
            )
            ON CONFLICT (incident_id) DO UPDATE SET 
                status = EXCLUDED.status,
                severity = EXCLUDED.severity,
                data = EXCLUDED.data
        `;
        console.log(`[DB] Incident ${incident_id} persisted to Neon.`);
    } catch (error) {
        console.error("❌ Database Save Error:", error);
    }
};

export default sql;
