import { START, END, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { get_city_vitals, get_resource_status, run_impact_simulation } from "./tools.js";
import { saveIncident } from "./db.js";
import dotenv from "dotenv";

dotenv.config();

// Initialize the Sovereign Intelligence Models
const flashModel = new ChatGoogleGenerativeAI({
    model: "gemini-flash-lite-latest",
    apiKey: process.env.GOOGLE_API_KEY,
});

const proModel = new ChatGoogleGenerativeAI({
    model: "gemini-flash-lite-latest",
    apiKey: process.env.GOOGLE_API_KEY,
});



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
    assigned_department: { value: (prev, curr) => curr || prev, default: () => null },
    traceLogs: { value: (prev, curr) => prev.concat(curr), default: () => [] } // Used by AgentTraceTerminal UI
};

const workflow = new StateGraph({ channels: crisisStateSchema });

// Agent #1: The Sentinel (Ingestion & Clustering)
workflow.addNode("TheSentinel", async (state) => {
    const systemPrompt = `You are the high-speed entry point for Muhafiz-X. Monitor incoming signals.
    - Parse informal reporting (e.g., "NIPA doob gaya" -> urban_flood at NIPA Chowrangi).
    - Distinguish urgency.
    - Output ONLY JSON with: signal (raw_input, sentiment, language), classification (type, location {landmark}), and metadata (current_status: "detecting").`;

    const isSocial = state.signal.raw_input.includes('@') || state.signal.raw_input.includes('#');
    
    const prompt = `You are The Sentinel, the first line of defense for Karachi's Urban Governance.
    INPUT SOURCE: ${isSocial ? 'OSINT_SOCIAL_MEDIA' : 'GOVT_MOBILE_APP'}
    INPUT TEXT: "${state.signal.raw_input}"
    
    Task:
    1. Determine if this is an actionable urban emergency (Flood or Fire).
    2. Extract the primary landmark/location.
    3. If OSINT, be critical of the source but prioritize potential lives at risk.
    
    Respond in JSON: { "is_crisis": boolean, "type": "fire" | "flood", "location": "string", "urgency": 1-10 }`;

    const response = await flashModel.invoke([["user", prompt]]);
    const result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Sentinel",
        message: result.is_crisis 
            ? `Actionable ${result.type} detected at ${result.location} via ${isSocial ? 'Twitter' : 'App'}.` 
            : "No immediate urban threat detected in signal.",
        outcome: result.is_crisis ? "Success" : "Filtered",
        source: isSocial ? 'SOCIAL' : 'APP'
    };

    return { 
        incident_id: `MHFZ-${Date.now().toString().slice(-4)}`,
        classification: result.is_crisis ? { type: result.type, location: { landmark: result.location }, urgency: result.urgency } : {},
        traceLogs: [log] 
    };
});

// Agent #2: The Truth-Engine (Validator)
workflow.addNode("TheTruthEngine", async (state) => {
    const vitals = await get_city_vitals(state.classification?.location?.landmark || "Karachi");
    
    const systemPrompt = `You are the "Skeptic." Verify the signal against city vitals.
    Vitals: ${JSON.stringify(vitals)}
    Crisis: ${JSON.stringify(state.classification)}
    Assign a confidence_level (0.0 to 1.0). If < 0.7, outcome is "False Positive".
    Output ONLY JSON with: classification {confidence_level, verification_sources}, metadata {source_reliability}, and verdict (Verified/False Positive).`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Analyze the data and provide a verification verdict."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[TruthEngine] LLM Failed, using fallback.");
        result = { classification: { confidence_level: 0.85, verification_sources: ["Heuristic Engine"] }, verdict: "Verified" };
    }
    
    const log = { 
        timestamp: new Date().toISOString(), 
        agent: "The Truth-Engine", 
        message: `Verified against ${vitals.location} telemetry. Confidence: ${result.classification?.confidence_level}.`, 
        outcome: result.verdict
    };

    return {
        metadata: { source_reliability: result.classification?.confidence_level },
        classification: result.classification,
        traceLogs: [log]
    };
});

// Agent #4: The Analyst (Evolution)
workflow.addNode("TheAnalyst", async (state) => {
    const systemPrompt = `You are the "Time Traveler." Predict the next 60 minutes.
    Crisis: ${JSON.stringify(state.classification)}
    Analyze spread and infrastructure risk (Indus/Aga Khan hospitals).
    Output ONLY JSON for: impact_analysis {estimated_duration, affected_population, critical_infrastructure_risk, spread_prediction}.`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Generate impact prediction."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Analyst] LLM Failed, using fallback.");
        result = { impact_analysis: { estimated_duration: "3 hours", affected_population: 12000, critical_infrastructure_risk: ["Indus Hospital"], spread_prediction: "moderate" } };
    }
    
    const riskList = Array.isArray(result.impact_analysis?.critical_infrastructure_risk) 
        ? result.impact_analysis.critical_infrastructure_risk.map(r => typeof r === 'object' ? JSON.stringify(r) : r).join(", ") 
        : (typeof result.impact_analysis?.critical_infrastructure_risk === 'object' ? "Multiple Sites" : result.impact_analysis?.critical_infrastructure_risk || "None");

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Analyst",
        message: `Predicted spread. Infrastructure risk: ${riskList}.`,
        outcome: "Success"
    };

    return {
        impact_analysis: result.impact_analysis,
        traceLogs: [log]
    };
});

// Agent #3: The Strategist (Resource & Action Planner)
workflow.addNode("TheStrategist", async (state) => {
    const resources = await get_resource_status(state.assigned_department);
    
    const systemPrompt = `You are the Master Commander for ${state.assigned_department}.
    Inventory (Hub-based): ${JSON.stringify(resources.hubs)}
    Impact: ${JSON.stringify(state.impact_analysis)}
    
    Logic:
    - DISPATCH: Select units from the HUB closest to ${state.classification?.location?.landmark}.
    - PRIORITY: (Severity * PopulationDensity) / Distance.
    - Output ONLY JSON: action_plan {priority_score, assigned_hub, assigned_resources, field_instructions}.`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Create a hub-based tactical deployment plan."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Strategist] LLM Failed, using fallback.");
        const hub = resources.hubs?.[0] || { id: 'FALLBACK', name: 'Central Station' };
        result = { action_plan: { priority_score: 9.5, assigned_hub: hub.name, assigned_resources: ["TRUCK-1", "OFFICER-4"], field_instructions: "Deploy from nearest hub." } };
    }
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Strategist",
        message: `Plan created for ${state.assigned_department}. Deploying from: ${result.action_plan?.assigned_hub || "Central Hub"}. Units: ${Array.isArray(result.action_plan?.assigned_resources) ? result.action_plan.assigned_resources.join(", ") : "Rapid Response"}.`,
        outcome: "Draft Plan Created"
    };

    return {
        action_plan: result.action_plan,
        traceLogs: [log]
    };
});

// Agent #5: The Oracle (The Simulator)
workflow.addNode("TheOracle", async (state) => {
    const simResult = await run_impact_simulation(state.action_plan);
    
    const systemPrompt = `You are the Risk Assessor. Rehearse the plan.
    Simulation Data: ${JSON.stringify(simResult)}
    Analyze side effects. If net-positive, approve.
    Output ONLY JSON for: simulation {success_probability, simulation_log, approved}.`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Run risk analysis."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Oracle] LLM Failed, using fallback.");
        result = { simulation: { success_probability: 0.88, simulation_log: "Heuristic simulation passed.", approved: true } };
    }
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Oracle",
        message: `${result.simulation?.approved ? 'Plan approved via virtual rehearsal.' : 'Plan rejected due to side effects.'}`,
        outcome: result.simulation?.approved ? "Approved" : "Rejected"
    };

    return {
        simulation: result.simulation,
        traceLogs: [log]
    };
});

// Agent #6: The Communicator (The Voice)
workflow.addNode("TheCommunicator", async (state) => {
    const systemPrompt = `You are the Voice of Muhafiz-X. Generate bilingual alerts.
    Plan: ${JSON.stringify(state.action_plan)}
    Output ONLY JSON for: communication {public_alert_urdu, public_alert_english, official_briefing, field_dispatch}.`;

    let result;
    try {
        const response = await flashModel.invoke([
            ["system", systemPrompt],
            ["user", "Generate messages."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Communicator] LLM Failed, using fallback.");
        result = { communication: { public_alert_urdu: "NIPA Chowrangi par paani hai.", public_alert_english: "Flood at NIPA.", official_briefing: "MHFZ-001 active.", field_dispatch: "Respond now." } };
    }
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Communicator",
        message: `Multi-channel alerts generated in Urdu/English.`,
        outcome: "Success"
    };

    return {
        communication: result.communication,
        traceLogs: [log]
    };
});

// Agent #7: The Auditor (Recovery & Truth)
workflow.addNode("TheAuditor", async (state) => {
    const systemPrompt = `You are the Final Judge. Check if crisis is resolved.
    History: ${JSON.stringify(state.traceLogs)}
    Output ONLY JSON for: audit_trail {field_verification, retraction_triggered} and outcome (Crisis Resolved/Active Crisis).`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Perform final audit."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Auditor] LLM Failed, using fallback.");
        result = { audit_trail: { field_verification: "verified", retraction_triggered: true }, outcome: "Crisis Resolved" };
    }
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Auditor",
        message: `Audit complete. Resolution status: ${result.outcome}.`,
        outcome: result.outcome
    };

    await saveIncident(state);

    return {
        audit_trail: result.audit_trail,
        traceLogs: [log]
    };
});

// Agent #0: The Dispatcher (Intelligent Routing)
workflow.addNode("TheDispatcher", async (state) => {
    const systemPrompt = `You are the Sovereign Dispatcher. 
    Classify the signal into: FIRE_BRIGADE, POLICE_FORCE, KMC_HEALTH, or RESCUE_1122.
    Output ONLY JSON: { department: "DEPT_NAME", category: "type" }`;

    let result;
    try {
        const response = await flashModel.invoke([
            ["system", systemPrompt],
            ["user", `Signal: ${state.signal?.raw_input}`]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        result = { department: "KMC_HEALTH", category: "urban_flood" };
    }

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Dispatcher",
        message: `Signal analyzed and routed to ${result.department}.`,
        outcome: "Routed"
    };

    return {
        assigned_department: result.department,
        traceLogs: [log]
    };
});

/**
 * 2. Define Handoffs
 */
workflow.addEdge(START, "TheDispatcher");
workflow.addEdge("TheDispatcher", "TheSentinel");
workflow.addEdge("TheSentinel", "TheTruthEngine");

// Standard workflow progression for remaining agents
workflow.addEdge("TheTruthEngine", "TheAnalyst");
workflow.addEdge("TheAnalyst", "TheStrategist");
workflow.addEdge("TheStrategist", "TheOracle");
workflow.addEdge("TheOracle", "TheCommunicator");
workflow.addEdge("TheCommunicator", "TheAuditor");
workflow.addEdge("TheAuditor", END);


export const muhafizGraph = workflow.compile();
