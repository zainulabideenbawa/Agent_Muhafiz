import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;


export const initDb = async () => {
    try {
        if (!process.env.DATABASE_URL) {
            console.warn("⚠️ DATABASE_URL not found. Neon DB integration disabled.");
            return;
        }

        console.log("Initializing Neon DB tables...");
        
        // Combined Schema: Agents + User Tracking
        await sql`
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
        // Fleet Management (Hubs)
        await sql`
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
        // Command Profiles (User Management)
        await sql`
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

        // Advanced Mission Tasking
        await sql`
            CREATE TABLE IF NOT EXISTS mission_tasks (
                id SERIAL PRIMARY KEY,
                task_id TEXT UNIQUE NOT NULL,
                incident_ref TEXT REFERENCES incidents(incident_id),
                status TEXT DEFAULT 'INGESTED', -- INGESTED, ANALYSIS, ASSIGNED, ON_SCENE, RESOLVED
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
        INSERT INTO incidents (incident_id, type, location, status, description, data)
        VALUES (${incidentId}, ${type || 'UNKNOWN'}, ${location || 'ANALYZING'}, 'PENDING', ${rawInput}, ${JSON.stringify({ raw_input: rawInput })})
        RETURNING *
    `;
};

export const updateIncidentState = async (incidentId, status, data) => {
    if (!sql) return;
    const lastAgent = data.traceLogs?.[data.traceLogs.length - 1]?.agent || 'SYSTEM';
    return await sql`
        UPDATE incidents 
        SET status = ${status}, data = ${JSON.stringify(data)}, last_agent = ${lastAgent}
        WHERE incident_id = ${incidentId}
        RETURNING *
    `;
};

export const getPendingIncidents = async () => {
    if (!sql) return [];
    return await sql`SELECT * FROM incidents WHERE status = 'PENDING' ORDER BY created_at ASC`;
};

// Departmental Inventory
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

export const getDepartmentResources = async (deptId) => {
    if (sql) {
        try {
            const results = await sql`SELECT * FROM department_hubs WHERE dept_id = ${deptId}`;
            if (results.length > 0) return results;
        } catch (e) { console.error("DB Fetch Failed:", e); }
    }
    return departmentResources[deptId] || [];
};

export const updateDepartmentResources = async (deptId, hubs) => {
    if (sql) {
        try {
            // Transactional update: delete and re-insert for simplicity in this demo
            await sql`DELETE FROM department_hubs WHERE dept_id = ${deptId}`;
            for (const hub of hubs) {
                await sql`
                    INSERT INTO department_hubs (dept_id, name, location, trucks, ambulances, officers)
                    VALUES (${deptId}, ${hub.name}, ${hub.location}, ${hub.trucks}, ${hub.ambulances}, ${hub.officers})
                `;
            }
        } catch (e) { console.error("DB Save Failed:", e); }
    }
    departmentResources[deptId] = hubs;
    return true;
};

// Sovereign Physical Sensor Registry (Karachi Megacity Grid)
const CITY_SENSORS = [
    { id: 'SEN-NIPA-W', name: 'NIPA Water Node', type: 'WATER_LEVEL', lat: 24.9175, lng: 67.0970 },
    { id: 'SEN-SAD-A', name: 'Saddar Air Station', type: 'AIR_QUALITY', lat: 24.8615, lng: 67.0099 },
    { id: 'SEN-CLI-W', name: 'Clifton Wind Node', type: 'WIND_SPEED', lat: 24.8138, lng: 67.0333 },
    { id: 'SEN-DEF-H', name: 'DHA Heat Sensor', type: 'TEMPERATURE', lat: 24.8250, lng: 67.0650 },
    { id: 'SEN-NAZ-A', name: 'Nazimabad AQI Node', type: 'AIR_QUALITY', lat: 24.9167, lng: 67.0333 },
    { id: 'SEN-GUL-H', name: 'Gulshan Humidity', type: 'HUMIDITY', lat: 24.9300, lng: 67.0900 },
    { id: 'SEN-MAL-T', name: 'Malir Temp Node', type: 'TEMPERATURE', lat: 24.8833, lng: 67.1833 },
    { id: 'SEN-KOR-A', name: 'Korangi Industrial AQI', type: 'AIR_QUALITY', lat: 24.8333, lng: 67.1167 },
    { id: 'SEN-LYA-W', name: 'Lyari Water Node', type: 'WATER_LEVEL', lat: 24.8667, lng: 66.9833 },
    { id: 'SEN-ORA-T', name: 'Orangi Heat Node', type: 'TEMPERATURE', lat: 24.9500, lng: 66.9667 },
    { id: 'SEN-SUR-A', name: 'Surjani AQI Station', type: 'AIR_QUALITY', lat: 25.0167, lng: 67.0667 },
    { id: 'SEN-FED-H', name: 'Federal B Humidity', type: 'HUMIDITY', lat: 24.9167, lng: 67.0667 },
    // SUB-SURFACE TOPOLOGY (NEW)
    { id: 'SEN-NIPA-SF', name: 'NIPA Sewer Flow', type: 'SEWER_FLOW', lat: 24.9175, lng: 67.0970 },
    { id: 'SEN-UNI-SF', name: 'University Rd Flow', type: 'SEWER_FLOW', lat: 24.9200, lng: 67.1100 },
    { id: 'SEN-SHA-SF', name: 'Shaheed-e-Millat Flow', type: 'SEWER_FLOW', lat: 24.8700, lng: 67.0700 }
];

export const getCitySensors = () => {
    return CITY_SENSORS.map(s => ({
        ...s,
        last_read: s.type === 'AIR_QUALITY' ? (Math.random() * 200 + 50).toFixed(0) : 
                   s.type === 'SEWER_FLOW' ? (Math.random() * 5).toFixed(1) + ' m/s' :
                   (Math.random() * 45).toFixed(1),
        status: s.type === 'SEWER_FLOW' && Math.random() > 0.8 ? 'CRITICAL' : (Math.random() > 0.05 ? 'ONLINE' : 'OFFLINE'),
        last_updated: new Date().toISOString()
    }));
};

export const getCityVitals = () => {
    const sensors = getCitySensors();
    const aqi = sensors.filter(s => s.type === 'AIR_QUALITY');
    const temp = sensors.filter(s => s.type === 'TEMPERATURE');
    const humidity = sensors.filter(s => s.type === 'HUMIDITY');

    return {
        avg_aqi: (aqi.reduce((acc, s) => acc + parseFloat(s.last_read), 0) / aqi.length).toFixed(0),
        avg_temp: (temp.reduce((acc, s) => acc + parseFloat(s.last_read), 0) / temp.length).toFixed(1),
        avg_humidity: (humidity.reduce((acc, s) => acc + parseFloat(s.last_read), 0) / humidity.length).toFixed(0),
        active_nodes: sensors.filter(s => s.status === 'ONLINE').length,
        total_nodes: sensors.length
    };
};

// Sovereign Performance Analytics (Historical Data)
const DEPARTMENT_PERFORMANCE = {
    'KMC_HEALTH': {
        resolved: 1420, active: 12, avg_response: '14m', citizen_rating: 4.8,
        top_muhafiz: 'Officer Ahmed (Gulshan Hub)',
        monthly_incidents: [120, 150, 180, 140, 210, 190],
        hub_performance: [
            { name: 'Gulshan Hub', status: 'Optimal', resolved: 450 },
            { name: 'Saddar Central', status: 'High Load', resolved: 970 }
        ]
    },
    'FIRE_BRIGADE': {
        resolved: 850, active: 4, avg_response: '9m', citizen_rating: 4.9,
        top_muhafiz: 'Captain Raza (Central Stn)',
        monthly_incidents: [40, 55, 70, 45, 80, 65],
        hub_performance: [
            { name: 'Central Fire Stn', status: 'Optimal', resolved: 600 },
            { name: 'Landhi Hub', status: 'Optimal', resolved: 250 }
        ]
    },
    'POLICE_FORCE': {
        resolved: 3200, active: 45, avg_response: '11m', citizen_rating: 4.2,
        top_muhafiz: 'Insp. Zafar (Defence Precinct)',
        monthly_incidents: [400, 450, 520, 480, 600, 550],
        hub_performance: [
            { name: 'Defence Precinct', status: 'Optimal', resolved: 1800 },
            { name: 'Nazimabad Station', status: 'Strained', resolved: 1400 }
        ]
    },
    'RESCUE_1122': {
        resolved: 2100, active: 8, avg_response: '12m', citizen_rating: 4.7,
        top_muhafiz: 'Para. Sara (Clifton HQ)',
        monthly_incidents: [200, 230, 280, 210, 310, 270],
        hub_performance: [
            { name: 'Clifton HQ', status: 'Optimal', resolved: 2100 }
        ]
    }
};

// 6. Sovereign Architect Intelligence (Optimization Engine)
export const getUrbanOptimization = () => {
    return {
        coverage_gaps: [
            { sector: 'MALIR_EAST', risk: 'HIGH', recommendation: 'ADD_AMBULANCE_HUB', logic: 'Avg response time > 18m' },
            { sector: 'NORTH_KARA', risk: 'CRITICAL', recommendation: 'DEPLOY_FLOOD_SENSOR', logic: 'High risk zone with 0 sensor density' },
            { sector: 'LYARI', risk: 'MEDIUM', recommendation: 'STATION_FIRE_BRIGADE', logic: 'Industrial density vs low asset count' }
        ],
        leaderboard: [
            { dept: 'RESCUE_1122', score: 98, status: 'ELITE', response: '8m' },
            { dept: 'FIRE_BRIGADE', score: 92, status: 'OPTIMAL', response: '11m' },
            { dept: 'POLICE_FORCE', score: 85, status: 'STRAINED', response: '14m' },
            { dept: 'KMC_HEALTH', score: 78, status: 'CRITICAL', response: '19m' }
        ],
        sensor_blindspots: [
            { lat: 24.95, lng: 67.12, reason: 'Zero telemetry in high-density residential' },
            { lat: 24.82, lng: 67.01, reason: 'Critical coastal monitoring gap' }
        ]
    };
};

export const getPerformanceStats = (deptId) => {
    return DEPARTMENT_PERFORMANCE[deptId] || DEPARTMENT_PERFORMANCE['KMC_HEALTH'];
};
