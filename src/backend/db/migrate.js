import { neonSql } from './connection.js';

export const initDb = async () => {
    try {
        if (!neonSql) {
            console.warn("⚠️ DATABASE_URL not found. Neon DB integration disabled.");
            return;
        }

        console.log("Initializing Neon DB tables...");

        await neonSql`
            CREATE TABLE IF NOT EXISTS incidents (
                id SERIAL PRIMARY KEY,
                incident_id TEXT UNIQUE NOT NULL,
                description TEXT,
                type TEXT,
                location TEXT,
                status TEXT DEFAULT 'PENDING',
                last_agent TEXT DEFAULT 'SENTINEL',
                data JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await neonSql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nic_number TEXT UNIQUE NOT NULL,
                name TEXT,
                sector TEXT,
                password TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await neonSql`
            CREATE TABLE IF NOT EXISTS department_hubs (
                id SERIAL PRIMARY KEY,
                dept_id TEXT NOT NULL,
                name TEXT NOT NULL,
                location TEXT,
                trucks INTEGER DEFAULT 0,
                ambulances INTEGER DEFAULT 0,
                officers INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await neonSql`
            CREATE TABLE IF NOT EXISTS command_profiles (
                id SERIAL PRIMARY KEY,
                commander_id TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                rank TEXT NOT NULL,
                department TEXT NOT NULL,
                permissions JSONB DEFAULT '[]',
                last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await neonSql`
            CREATE TABLE IF NOT EXISTS mission_tasks (
                id SERIAL PRIMARY KEY,
                task_id TEXT UNIQUE NOT NULL,
                incident_ref TEXT REFERENCES incidents(incident_id),
                status TEXT DEFAULT 'INGESTED',
                assigned_hub TEXT,
                assigned_agent TEXT,
                priority_level INTEGER DEFAULT 1,
                mission_objective TEXT,
                resolution_summary TEXT,
                completed_at TIMESTAMP WITH TIME ZONE
            )
        `;

        console.log("✅ Neon DB tables ready.");
    } catch (error) {
        console.error("❌ Database Initialization Error:", error);
    }
};
