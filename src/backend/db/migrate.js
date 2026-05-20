import { neonSql } from './connection.js';

export const initDb = async () => {
    try {
        if (!neonSql) {
            console.warn("⚠️ DATABASE_URL not found. Neon DB integration disabled.");
            return;
        }

        console.log("Initializing Neon DB tables...");

        const incidentsTable = await neonSql`
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
        console.log("Incidents table created successfully.", incidentsTable);

        const usersTable = await neonSql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                nic_number TEXT UNIQUE NOT NULL,
                name TEXT,
                sector TEXT,
                password TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log("Users table created successfully.", usersTable);

        const departmentHubsTable = await neonSql`
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
        console.log("Department hubs table created successfully.", departmentHubsTable);

        const commandProfilesTable = await neonSql`
            CREATE TABLE IF NOT EXISTS command_profiles (
                id SERIAL PRIMARY KEY,
                commander_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                cnic TEXT,
                name TEXT NOT NULL,
                rank TEXT NOT NULL,
                department TEXT NOT NULL,
                password TEXT,
                permissions JSONB DEFAULT '[]',
                last_login TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `;
        console.log("Command profiles table created successfully.", commandProfilesTable);

        // Migrate: add cnic and password columns if they don't exist yet
        await neonSql`ALTER TABLE command_profiles ADD COLUMN IF NOT EXISTS cnic TEXT`;
        await neonSql`ALTER TABLE command_profiles ADD COLUMN IF NOT EXISTS password TEXT`;
        // Migrate: make email unique (safe – only runs if constraint doesn't exist)
        await neonSql`
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'command_profiles_email_key'
                ) THEN
                    ALTER TABLE command_profiles ADD CONSTRAINT command_profiles_email_key UNIQUE (email);
                END IF;
            END $$
        `;

        const missionTasksTable = await neonSql`
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
        console.log("Mission tasks table created successfully.", missionTasksTable);

        console.log("✅ Neon DB tables ready.");

        // ─── SEED DEFAULT COMMANDERS & SUPER ADMIN ──────────────────────────────
        const defaultCommanders = [
            { id: 'SUPER-001', email: 'admin@muhafiz.gov', cnic: null, name: 'Sovereign Architect', rank: 'Sovereign-1', dept: 'SOVEREIGN', password: process.env.ADMIN_PASSWORD || 'sovereign' },
            { id: 'CMD-001', email: 'kmc@muhafiz.gov', cnic: null, name: 'Eng. Zafar', rank: 'Infrastructure Chief', dept: 'KMC_HEALTH', password: process.env.DEFAULT_OFFICER_PASSWORD || 'muhafiz' },
            { id: 'CMD-002', email: 'police@muhafiz.gov', cnic: null, name: 'Cmdr. Ahmed', rank: 'Sindh Police Marshal', dept: 'POLICE_FORCE', password: process.env.DEFAULT_OFFICER_PASSWORD || 'muhafiz' },
            { id: 'CMD-003', email: 'fire@muhafiz.gov', cnic: null, name: 'Capt. Raza', rank: 'Fire Chief', dept: 'FIRE_BRIGADE', password: process.env.DEFAULT_OFFICER_PASSWORD || 'muhafiz' },
            { id: 'CMD-004', email: 'rescue@muhafiz.gov', cnic: null, name: 'Para. Sara', rank: 'Rescue Director', dept: 'RESCUE_1122', password: process.env.DEFAULT_OFFICER_PASSWORD || 'muhafiz' },
        ];

        for (const c of defaultCommanders) {
            const commander = await neonSql`
                INSERT INTO command_profiles (commander_id, email, cnic, name, rank, department, password, permissions)
                VALUES (${c.id}, ${c.email}, ${c.cnic}, ${c.name}, ${c.rank}, ${c.dept}, ${c.password}, '["DEPLOY_RESOURCES","VIEW_MAP"]')
                ON CONFLICT (commander_id) DO UPDATE
                    SET email    = EXCLUDED.email,
                        name     = EXCLUDED.name,
                        rank     = EXCLUDED.rank,
                        password = COALESCE(command_profiles.password, EXCLUDED.password)
            `;
            console.log("Commander seeded successfully.", commander);
        }

        console.log("✅ Default commanders seeded.");

    } catch (error) {
        console.error("❌ Database Initialization Error:", error);
    }
};

// Auto-run if executed directly via `node migrate.js`
if (process.argv[1] === new URL(import.meta.url).pathname) {
    initDb().then(() => {
        console.log("Migration script finished.");
        process.exit(0);
    });
}


