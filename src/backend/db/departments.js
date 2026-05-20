import { eq } from 'drizzle-orm';
import { db } from './connection.js';
import { department_hubs } from './schema.js';
import { broadcast } from '../websocket.js';

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
    ],
    'KWSC_FWO': [
        { id: 'KWSC-GUL', name: 'KWSC Gulshan Depot', location: 'Gulshan', trucks: 4, ambulances: 0, officers: 12 },
        { id: 'FWO-CEN', name: 'FWO Central HQ', location: 'Saddar', trucks: 5, ambulances: 0, officers: 20 }
    ]
};

export const getDepartmentResources = async (deptId) => {
    if (db) {
        try {
            const results = await db.select().from(department_hubs).where(eq(department_hubs.dept_id, deptId));
            if (results.length > 0) return results;
        } catch (e) { console.error("DB Fetch Failed:", e); }
    }
    return departmentResources[deptId] || [];
};

export const updateDepartmentResources = async (deptId, hubs) => {
    if (db) {
        try {
            await db.delete(department_hubs).where(eq(department_hubs.dept_id, deptId));
            await db.insert(department_hubs).values(
                hubs.map(hub => ({ dept_id: deptId, name: hub.name, location: hub.location, trucks: hub.trucks, ambulances: hub.ambulances, officers: hub.officers }))
            );
        } catch (e) { console.error("DB Save Failed:", e); }
    }
    departmentResources[deptId] = hubs;
    // Broadcast resource update to all connected clients
    broadcast({ type: 'RESOURCES_UPDATED', deptId, hubs });
    return true;
};

export const deployHub = async (dept, sector) => {
    if (db) {
        try {
            await db.insert(department_hubs).values({
                dept_id: dept,
                name: `${sector} Station`,
                location: sector,
                trucks: 5,
                ambulances: 2,
                officers: 10,
            });
        } catch (e) { console.error("DB deployHub Failed:", e); }
    }
    if (!departmentResources[dept]) {
        departmentResources[dept] = [];
    }
    // Check if station already exists to prevent duplicate mocks
    const exists = departmentResources[dept].some(h => h.location === sector);
    if (!exists) {
        departmentResources[dept].push({
            id: `HUB-${Date.now()}`,
            name: `${sector} Station`,
            location: sector,
            trucks: 5,
            ambulances: 2,
            officers: 10
        });
    }
};
