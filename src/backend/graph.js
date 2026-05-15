import { StateGraph } from "@langchain/langgraph";

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

    // Simulate Gemini 1.5 Pro verifying via Tools
    const isReliable = state.signal?.sentiment === "urgent";
    const confidence = isReliable ? 0.95 : 0.4;
    
    const log = { 
        timestamp: new Date().toISOString(), 
        agent: "The Truth-Engine", 
        message: `Gemini 1.5 Pro: Maps tool check for ${state.classification?.location?.landmark || "Unknown"}. Traffic <10km/h. Verified.`, 
        outcome: confidence >= 0.7 ? "Verified" : "False Positive"
    };
    return {
        metadata: { source_reliability: confidence },
        classification: { confidence_level: confidence, verification_sources: ["Google Maps Traffic", "Weather API"] },
        traceLogs: [log]
    };
});

// The Analyst (Severity Prediction)
workflow.addNode("TheAnalyst", async (state) => { /* Populates impact_analysis */ return {}; });

// Agent #3: The Strategist (Resource & Action Planner)
// Model: Gemini 1.5 Pro (Reasoning)
workflow.addNode("TheStrategist", async (state) => {
    const systemPrompt = `You are the Master Commander of Karachi's emergency assets. You solve for maximum safety with minimum waste.
Logic:
- Access the Resource_Inventory tool. You have X suction trucks and Y ambulances available.
- Use the formula: Priority = (Severity * PopulationDensity) / Distance.
- Plan: Select the specific units to dispatch and determine the best rerouting path using the Directions Tool.
- Handoff: Your plan is DRAFT ONLY. You must pass this to the Oracle Agent for simulation before it can be finalized.`;

    // Simulate Gemini 1.5 Pro reasoning logic
    const priority = 8.5; // Computed from Priority = (Severity * PopulationDensity) / Distance
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Strategist",
        message: `Gemini 1.5 Pro: Computed Priority ${priority}. Dispatching 2 Suction Trucks from Gulshan Depot. Routing via Univ Road.`,
        outcome: "Draft Plan Created"
    };

    return {
        action_plan: {
            priority_score: priority,
            assigned_resources: ["Suction-Truck-G1", "Suction-Truck-G2"],
            rerouting_nodes: ["University Road", "Hassan Square"],
            field_instructions: "Deploy pumps at NIPA underpass immediately."
        },
        traceLogs: [log]
    };
});
workflow.addNode("TheOracle", async (state) => { /* Populates simulation */ return {}; });
workflow.addNode("TheCommunicator", async (state) => { /* Populates communication */ return {}; });
workflow.addNode("TheAuditor", async (state) => { /* Populates audit_trail */ return {}; });

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
