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

export const saveIncident = async (incidentId, type, location, rawInput) => {
    if (!sql) return;
    return await sql`
        INSERT INTO incidents (incident_id, type, location, status, data)
        VALUES (${incidentId}, ${type || 'UNKNOWN'}, ${location || 'ANALYZING'}, 'PENDING', ${JSON.stringify({ raw_input: rawInput })})
        RETURNING *
    `;
};

export const updateIncidentState = async (incidentId, status, data) => {
    if (!sql) return;
    return await sql`
        UPDATE incidents 
        SET status = ${status}, data = ${JSON.stringify(data)}
        WHERE incident_id = ${incidentId}
        RETURNING *
    `;
};

export const getPendingIncidents = async () => {
    if (!sql) return [];
    return await sql`SELECT * FROM incidents WHERE status = 'PENDING' ORDER BY created_at ASC`;
};

// Departmental Inventory (In-memory fallback for now, but wired for DB)
let departmentResources = {
    'KMC_HEALTH': [
        { id: 'KMC-GUL', name: 'Gulshan Hub', location: 'Gulshan', trucks: 5, ambulances: 3, officers: 15 },
        { id: 'KMC-SAD', name: 'Saddar Central', location: 'Saddar', trucks: 7, ambulances: 5, officers: 30 }
    ],
    'POLICE_FORCE': [
        { id: 'SPF-DEF', name: 'Defence Precinct', location: 'Defence', trucks: 10, ambulances: 1, officers: 50 },
        { id: 'SPF-NAZ', name: 'Nazimabad Station', location: 'Nazimabad', trucks: 8, ambulances: 1, officers: 40 }
    ],
    'FIRE_BRIGADE': [
        { id: 'FB-CEN', name: 'Central Fire Station', location: 'Saddar', trucks: 10, ambulances: 2, officers: 40 },
        { id: 'FB-LAN', name: 'Landhi Hub', location: 'Landhi', trucks: 5, ambulances: 2, officers: 20 }
    ],
    'RESCUE_1122': [
        { id: 'R11-CLI', name: 'Clifton HQ', location: 'Clifton', trucks: 3, ambulances: 15, officers: 30 }
    ]
};

export const getDeptResources = (deptId) => {
    return departmentResources[deptId] || departmentResources['KMC_HEALTH'];
};

export const updateDeptResources = (deptId, hubs) => {
    departmentResources[deptId] = hubs;
    console.log(`[Neon DB] Updated hubs for ${deptId}`);
    return departmentResources[deptId];
};
