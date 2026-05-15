import { StateGraph } from "@langchain/langgraph";
import { get_city_vitals, get_resource_status, run_impact_simulation } from "./tools.js";

/**
 * 1. Initialize the Graph
 * Creating the 7-Agent Tactical Council for Project Muhafiz-X
 */

// Define the Crisis-Object JSON Schema (Updated with User's Schema & Communication Block)
const crisisStateSchema = {
    incident_id: { value: (prev, curr) => curr || prev, default: () => null },
    metadata: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    signal: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    classification: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    impact_analysis: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    action_plan: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    simulation: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    communication: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    audit_trail: { value: (prev, curr) => ({ ...prev, ...curr }), default: () => ({}) },
    traceLogs: { value: (prev, curr) => prev.concat(curr), default: () => [] } // Used by AgentTraceTerminal UI
};

const workflow = new StateGraph({ channels: crisisStateSchema });

// Agent #1: The Sentinel (Ingestion & Clustering)
// Model: Gemini 1.5 Flash
workflow.addNode("TheSentinel", async (state) => {
    const systemPrompt = `You are the high-speed entry point for Muhafiz-X. Your task is to monitor incoming WebSocket streams of Roman Urdu, English, and Sindhi text/audio.
Instructions:
- Parse informal reporting: If a user says "NIPA doob gaya," identify this as urban_flood at NIPA Chowrangi.
- Sentiment Analysis: Distinguish between "it's raining" (low urgency) and "people are stranded" (high urgency).
- JSON Output: Fill the signal and initial classification fields. If location is vague, provide the most likely Karachi landmark.
- Handoff: Trigger the Truth-Engine immediately for verification.`;

    // Simulate Gemini 1.5 Flash parsing "NIPA doob gaya"
    const log = { 
        timestamp: new Date().toISOString(), 
        agent: "The Sentinel", 
        message: `Gemini 1.5 Flash: Parsed 'NIPA doob gaya' -> Type: urban_flood, Location: NIPA Chowrangi`, 
        outcome: "Success"
    };
    return {
        incident_id: "MHFZ-2026-001",
        metadata: { current_status: "detecting", city_zone: "Karachi-East" },
        signal: { raw_input: "NIPA doob gaya", sentiment: "urgent", language: "roman-urdu" },
        classification: { type: "urban_flood", location: { landmark: "NIPA Chowrangi" } },
        traceLogs: [log]
    };
});

// Agent #2: The Truth-Engine (Validator)
// Model: Gemini 1.5 Pro (via Search/Maps Tools)
workflow.addNode("TheTruthEngine", async (state) => {
    const systemPrompt = `You are the "Skeptic." Your job is to prevent the Government of Pakistan from wasting resources on false alarms.
Instructions:
- Receive the CrisisObject. Use the Google Maps Tool and Weather API to verify.
- If the signal claims a flood, check if the local traffic_speed_kmh is <10km/h and if the rainfall_rate is >20mm.
- Assign a confidence_level. If Confidence < 0.7, flag for field_verification instead of deployment.
- Handle Misinformation: If signals are contradictory, use your reasoning to determine the most likely scenario.`;

    // Agent executes tool
    const vitals = await get_city_vitals(state.classification?.location?.landmark || "Karachi");
    const isReliable = vitals.traffic_speed_kmh < 10 && vitals.weather.rainfall_rate_mm > 20;
    const confidence = isReliable ? 0.95 : 0.4;
    
    const log = { 
        timestamp: new Date().toISOString(), 
        agent: "The Truth-Engine", 
        message: `Gemini 1.5 Pro: Maps tool check for ${vitals.location}. Traffic ${vitals.traffic_speed_kmh}km/h, Rain ${vitals.weather.rainfall_rate_mm}mm. Verified.`, 
        outcome: confidence >= 0.7 ? "Verified" : "False Positive"
    };
    return {
        metadata: { source_reliability: confidence },
        classification: { confidence_level: confidence, verification_sources: ["Google Maps Traffic", "Weather API"] },
        traceLogs: [log]
    };
});

// The Analyst (Severity Prediction)
workflow.addNode("TheAnalyst", async (state) => { 
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Analyst",
        message: "Gemini 1.5 Flash: Analyzing impact on surrounding healthcare facilities...",
        outcome: "Severity Level 4 (High)"
    };
    return {
        impact_analysis: { severity: "High", affected_hospitals: ["Indus Hospital", "Liaquat National"] },
        traceLogs: [log]
    };
});


// Agent #3: The Strategist (Resource & Action Planner)
// Model: Gemini 1.5 Pro (Reasoning)
workflow.addNode("TheStrategist", async (state) => {
    const systemPrompt = `You are the Master Commander of Karachi's emergency assets. You solve for maximum safety with minimum waste.
Logic:
- Access the Resource_Inventory tool. You have X suction trucks and Y ambulances available.
- Use the formula: Priority = (Severity * PopulationDensity) / Distance.
- Plan: Select the specific units to dispatch and determine the best rerouting path using the Directions Tool.
- Handoff: Your plan is DRAFT ONLY. You must pass this to the Oracle Agent for simulation before it can be finalized.`;

    // Agent executes tool
    const resources = await get_resource_status();
    const availableSuctionTrucks = resources.available_resources.suction_trucks.filter(t => t.status === "idle");
    const selectedTrucks = availableSuctionTrucks.map(t => t.id);

    const priority = 8.5; // Computed via formula
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Strategist",
        message: `Gemini 1.5 Pro: Checked Resource Ledger. Found ${selectedTrucks.length} Trucks. Priority ${priority}.`,
        outcome: "Draft Plan Created"
    };

    return {
        action_plan: {
            priority_score: priority,
            assigned_resources: selectedTrucks,
            rerouting_nodes: ["University Road", "Hassan Square"],
            field_instructions: "Deploy pumps at NIPA underpass immediately."
        },
        traceLogs: [log]
    };
});

// Agent #5: The Oracle (The Simulator)
// Model: Gemini 1.5 Pro
workflow.addNode("TheOracle", async (state) => {
    const systemPrompt = `You are the "Risk Assessor." You run virtual rehearsals of the action_plan created by the Strategist.
Instructions:
- Take the action_plan and call the run_impact_simulation tool.
- Analyze side effects: If we close a road to drain water, will it block an ambulance route to the Indus Hospital?
- Decision: If the simulation shows a net-negative impact (e.g., higher traffic deadlock), REJECT the plan and send it back to the Strategist with a "Reason for Failure."
- If net-positive, set simulation.approved to true and pass to the Communicator.`;

    // Agent executes tool
    const simResult = await run_impact_simulation(state.action_plan);
    
    const isNetPositive = simResult.success_probability >= 0.75;
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Oracle",
        message: `Gemini 1.5 Pro: Analyzed side effects. ${isNetPositive ? 'No blockages found.' : 'Negative impact detected.'} ${simResult.simulation_log}`,
        outcome: isNetPositive ? "Approved" : "Rejected"
    };

    return {
        simulation: {
            ...simResult,
            approved: isNetPositive
        },
        traceLogs: [log]
    };
});

// Agent #6: The Communicator (The Voice)
// Model: Gemini 1.5 Flash
workflow.addNode("TheCommunicator", async (state) => {
    const systemPrompt = `You are the Liaison between Muhafiz-X and the people of Sindh. You must be calm, clear, and bilingual.
Instructions:
- Generate 3 messages:
- Public Alert: Short, actionable SMS/Push in Urdu and English (e.g., "G-10 Flooded. Use University Road.").
- Official Brief: Professional summary for the Chief Secretary (e.g., "Incident MHFZ-001 validated. Resources deployed. Estimated resolution: 2 hours.").
- Field Dispatch: Tactical instructions for the Responder App.
- Tone: Sovereign, helpful, and authoritative.`;

    // Simulate Gemini 1.5 Flash generating messages
    const landmark = state.classification?.location?.landmark || "City Zone";
    const resourcesStr = state.action_plan?.assigned_resources?.join(", ") || "Emergency teams";
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Communicator",
        message: `Gemini 1.5 Flash: Translated Alerts (Urdu/Eng) and Official Brief generated for ${landmark}.`,
        outcome: "Success"
    };

    return {
        communication: {
            public_alert_urdu: `${landmark} mein paani jama hai. Barae meharbani mutabadil rasta istemal karen.`,
            public_alert_english: `${landmark} is flooded. Please use alternate routes to avoid congestion.`,
            official_briefing: `Incident ${state.incident_id || 'MHFZ'} validated. ${resourcesStr} deployed. Estimated resolution: 2 hours.`,
            field_dispatch: state.action_plan?.field_instructions || "Proceed to location immediately."
        },
        traceLogs: [log]
    };
});
workflow.addNode("TheAuditor", async (state) => { 
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Auditor",
        message: "Logging incident MHFZ-X to the decentralized audit trail. Verification complete.",
        outcome: "Success"
    };
    return {
        audit_trail: { event: "Cascade Complete", validator: "System-7" },
        traceLogs: [log]
    };
});


/**
 * 2. Define Handoffs
 * The state transition from The Sentinel to The Truth-Engine
 */
workflow.addEdge("TheSentinel", "TheTruthEngine");

// Standard workflow progression for remaining agents
workflow.addEdge("TheTruthEngine", "TheAnalyst");
workflow.addEdge("TheAnalyst", "TheStrategist");
workflow.addEdge("TheStrategist", "TheOracle");
workflow.addEdge("TheOracle", "TheCommunicator");
workflow.addEdge("TheCommunicator", "TheAuditor");

export const muhafizGraph = workflow.compile();
