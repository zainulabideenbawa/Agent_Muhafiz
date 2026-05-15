/**
 * Core Tools & Tool-Calling Functions for Muhafiz-X Agents
 */

/**
 * Tool for The Truth-Engine: Verifies conditions at a specific location.
 * @param {string} location - Karachi specific location/landmark
 * @returns {object} Mock traffic and weather data
 */
export const get_city_vitals = async (location) => {
    console.log(`[Tool] get_city_vitals called for: ${location}`);
    
    // In a real app, this would hit Google Maps API & OpenWeather. 
    // Here we provide mock data specific to Karachi crisis conditions.
    const isFloodZone = location.toLowerCase().includes("nipa") || location.toLowerCase().includes("sharea faisal");
    
    return {
        location: location,
        timestamp: new Date().toISOString(),
        traffic_speed_kmh: isFloodZone ? 8 : 45, // Heavy congestion if in flood zone
        weather: {
            condition: isFloodZone ? "Heavy Monsoon Rain" : "Clear",
            rainfall_rate_mm: isFloodZone ? 25 : 0,
            water_level_cm: isFloodZone ? 40 : 0
        }
    };
};

/**
 * Tool for The Strategist: Fetches available emergency units.
 * @returns {object} Available resources from the "Mock Ledger"
 */
export const get_resource_status = async () => {
    console.log(`[Tool] get_resource_status called`);
    
    return {
        timestamp: new Date().toISOString(),
        available_resources: {
            suction_trucks: [
                { id: "ST-01", depot: "Gulshan-e-Iqbal", status: "idle", eta_mins: 15 },
                { id: "ST-02", depot: "Saddar", status: "idle", eta_mins: 35 }
            ],
            ambulances: [
                { id: "AMB-104", depot: "Chhipa NIPA", status: "idle", eta_mins: 5 },
                { id: "AMB-211", depot: "Edhi Sohrab Goth", status: "idle", eta_mins: 12 }
            ],
            police_units: [
                { id: "R-15", unit: "Traffic Police Zone East", status: "patrol", eta_mins: 8 }
            ]
        }
    };
};

/**
 * Tool for The Oracle: Simulates the outcome of a proposed Action Plan.
 * @param {object} action_plan - The Strategist's DRAFT plan
 * @returns {object} Simulation outcome with success probabilities
 */
export const run_impact_simulation = async (action_plan) => {
    console.log(`[Tool] run_impact_simulation called with resources: ${action_plan?.assigned_resources?.join(", ")}`);
    
    // Mock simulation logic: If suction trucks are assigned, probability of success is high
    const hasSuctionTrucks = action_plan?.assigned_resources?.some(r => r.includes("ST") || r.toLowerCase().includes("suction"));
    
    const probability = hasSuctionTrucks ? 0.88 : 0.45;
    const timeSaved = hasSuctionTrucks ? "120 minutes" : "0 minutes";
    const livesAtRiskDelta = hasSuctionTrucks ? -15 : -2; // Reduced risk by 15 lives

    return {
        simulation_run_id: `SIM-${Math.floor(Math.random() * 10000)}`,
        success_probability: probability,
        time_saved_metric: timeSaved,
        lives_at_risk_delta: livesAtRiskDelta,
        before_state_congestion: 85,
        after_state_congestion: hasSuctionTrucks ? 45 : 80,
        approved: probability > 0.75, // The Oracle only approves if > 75% success probability
        simulation_log: hasSuctionTrucks 
            ? "Simulation confirms suction trucks will clear NIPA underpass in 2 hours. Traffic flow restored by 45%. Plan Approved." 
            : "Insufficient resources assigned to clear water. Congestion will persist. Plan Rejected."
    };
};
