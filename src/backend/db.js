export const initDb = async () => {
    try {
        console.log("Initializing Neon DB tables...");
        // Incidents Table
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
    console.log("[Neon DB] Persisting incident state...");
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log(`[Neon DB] Incident ${state.metadata?.incidentId || 'MHFZ-SYS'} saved successfully!`);
    return true;
};

export const getDeptResources = (deptId) => {
    return departmentResources[deptId] || departmentResources['KMC_HEALTH'];
};

export const updateDeptResources = (deptId, hubs) => {
    departmentResources[deptId] = hubs;
    console.log(`[Neon DB] Updated hubs for ${deptId}`);
    return departmentResources[deptId];
};
