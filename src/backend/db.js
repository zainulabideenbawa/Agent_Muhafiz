// Granular Sovereign Inventory (Mocking Neon DB)
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
