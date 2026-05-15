export const saveIncident = async (state) => {
    console.log("[Neon DB] Persisting incident state...");
    // Simulate network delay to database
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[Neon DB] Incident ${state.incident_id || 'UNKNOWN'} saved successfully!`);
    return true;
};
