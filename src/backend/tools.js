/**
 * Core Tools for Muhafiz-X Agents
 * These functions connect the Agents to the Backend REST APIs.
 */

const BACKEND_URL = "http://127.0.0.1:3001";

/**
 * Tool for The Truth-Engine: Connects to /tools/vitals
 */
export const get_city_vitals = async (location) => {
    console.log(`[Agent Tool] Fetching vitals from API for: ${location}`);
    try {
        const response = await fetch(`${BACKEND_URL}/tools/vitals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location })
        });
        const data = await response.json();
        
        // Bug 1 Fix: return avg_temp and avg_humidity directly — Truth Engine reads these fields
        // The old nested 'weather' object was hiding them from the confidence heuristic
        return {
            location: location,
            avg_temp: data.avg_temp,
            avg_humidity: data.avg_humidity,
            traffic_speed_kmh: data.traffic_speed,
            rainfall_mm: data.rainfall,
            water_level_cm: data.water_level
        };
    } catch (error) {
        console.error("Tool Error (vitals):", error);
        // Fallback also provides correct field names
        return { location, avg_temp: 30, avg_humidity: 65, traffic_speed_kmh: 40, rainfall_mm: 0, water_level_cm: 0 };
    }
};

/**
 * Tool for The Strategist: Connects to /tools/resources
 */
export const get_resource_status = async (deptId) => {
    const targetDept = deptId || 'KMC_HEALTH';
    console.log(`[Agent Tool] Fetching granular resources for department: ${targetDept}`);
    try {
        const response = await fetch(`${BACKEND_URL}/api/department-resources/${targetDept}`);
        const hubs = await response.json();
        
        // Return the actual hubs so the Strategist can see locations
        return {
            department: targetDept,
            hubs: hubs.map(hub => ({
                id: hub.id,
                name: hub.name,
                location: hub.location,
                inventory: {
                    trucks: Array(hub.trucks).fill(0).map((_, i) => ({ id: `${hub.id}-TR-${i}`, status: "idle" })),
                    ambulances: Array(hub.ambulances).fill(0).map((_, i) => ({ id: `${hub.id}-AMB-${i}`, status: "idle" })),
                    officers: Array(hub.officers).fill(0).map((_, i) => ({ id: `${hub.id}-OFF-${i}`, status: "ready" }))
                }
            }))
        };
    } catch (error) {
        console.error("Tool Error (resources):", error);
        return { department: targetDept, hubs: [] };
    }
};

/**
 * Tool for The Oracle: Connects to /tools/simulate
 */
export const run_impact_simulation = async (action_plan) => {
    console.log(`[Agent Tool] Running simulation via API`);
    try {
        const response = await fetch(`${BACKEND_URL}/tools/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action_plan })
        });
        const data = await response.json();
        
        return {
            success_probability: data.approved ? 0.9 : 0.3,
            simulation_log: `Approved: ${data.approved}. Time Saved: ${data.time_saved_minutes} mins. Congestion: ${data.congestion_reduction_percent}%`,
            approved: data.approved
        };
    } catch (error) {
        console.error("Tool Error (simulate):", error);
        return { success_probability: 0.5, approved: false, simulation_log: "Simulation API unreachable" };
    }
};
