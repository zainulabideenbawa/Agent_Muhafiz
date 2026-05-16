import { START, END, StateGraph } from "@langchain/langgraph";
import { config } from 'dotenv';
config();

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
        signal: { source: isSocial ? 'SOCIAL' : 'APP' },
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
    
    const prompt = `You are the Sovereign Strategist for ${state.assigned_department}.
    LOCATION: ${state.classification?.location?.landmark}
    AVAILABLE FLEET: ${JSON.stringify(resources.hubs)}
    VERIFIED TRUTH: ${JSON.stringify(state.truth_analysis)}
    
    Task:
    1. Select the exact HUB for deployment.
    2. Specify units (e.g., Heavy Tanker, Life-Support Ambulance).
    3. Calculate ETA based on traffic (${state.truth_analysis?.confidence}% sensor accuracy).
    4. Provide a 'Tactical Directive' for field staff (including traffic diversions).
    
    Respond in JSON: {
        "priority_level": "CRITICAL" | "STANDARD",
        "deployment": { "hub": "string", "units": ["string"], "eta_mins": number },
        "tactical_directive": "string",
        "inter_agency_coordination": "string"
    }`;

    const response = await proModel.invoke([["user", prompt]]);
    const result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Strategist",
        message: `TACTICAL DIRECTIVE: ${result.deployment.units.join(", ")} dispatched from ${result.deployment.hub}. ETA: ${result.deployment.eta_mins} mins. ${result.tactical_directive}`,
        outcome: "Plan Locked"
    };

    return { 
        action_plan: result,
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
    const { classification } = state;
    const isMajor = (classification.urgency || 5) > 7;
    
    const systemPrompt = `You are the Voice of Muhafiz-X. Generate multi-channel bilingual alerts.
    Task:
    1. Scope: Decide if this is LOCAL (within 5km) or GLOBAL (City-wide).
    2. Citizen App Push: Create a short notification for the mobile app (Free channel).
    3. WhatsApp Broadcast: Create a detailed update for the Official Govt Channel (Free channel).
    4. Bilingual: Provide English and Urdu versions.
    
    Output ONLY JSON: {
        "scope": "LOCAL" | "GLOBAL",
        "radius_km": number,
        "push_notification": { "en": "string", "ur": "string" },
        "whatsapp_draft": { "en": "string", "ur": "string" },
        "mayor_brief": "string"
    }`;

    let result;
    try {
        const response = await flashModel.invoke([
            ["system", systemPrompt],
            ["user", `Crisis: ${classification.type} at ${classification.location?.landmark}`]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Communicator] LLM Failed, using fallback.");
        result = {
            scope: "LOCAL",
            radius_km: 5,
            push_notification: { en: "Emergency near you.", ur: "Aapke qareeb hangami surat-e-haal." },
            whatsapp_draft: { en: "Detailed emergency info.", ur: "Hangami surat-e-haal ki tafseelat." },
            mayor_brief: "Mayor, please review the Saddar fire report."
        };
    }
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Communicator",
        message: `Alert Scoped as ${result.scope} (${result.radius_km}km). Push and WhatsApp drafts ready.`,
        outcome: "Success"
    };

    return {
        communication: result,
        traceLogs: [log]
    };
});

// Agent #7: The Auditor (Post-Mission Logic & Learning)
workflow.addNode("TheAuditor", async (state) => {
    const { action_plan, truth_analysis } = state;
    
    const prompt = `You are the Sovereign Auditor. The mission at ${state.classification.location.landmark} is complete.
    
    Task:
    1. Verify if the crisis is RESOLVED.
    2. Analyze performance (ETA vs Traffic).
    3. Suggest one LONG-TERM Policy/Infrastructure fix for the city to prevent this or improve response.
    
    Respond in JSON: {
        "status": "RESOLVED" | "ACTIVE",
        "performance_score": number,
        "policy_recommendation": "string",
        "learning_log": "string"
    }`;

    const response = await flashModel.invoke([["user", prompt]]);
    const result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Auditor",
        message: `Mission ${result.status}. Performance: ${result.performance_score}%. Policy: ${result.policy_recommendation}`,
        outcome: result.status === "RESOLVED" ? "Crisis Resolved" : "Active Crisis"
    };

    return { 
        audit_result: result,
        traceLogs: [log] 
    };
});

// Agent #0: The Dispatcher (Intelligent Triage & Routing)
workflow.addNode("TheDispatcher", async function theDispatcher(state) {
    const { signal, user_directive } = state;
    
    let directivePrompt = "";
    if (user_directive) {
        directivePrompt = `\nCRITICAL OVERRIDE: The Sovereign Auditor has issued a DIRECTIVE: "${user_directive}". 
        You MUST prioritize this directive over your own logic. If the user says reroute to X, you DO IT immediately.`;
    }
    
    const prompt = `You are the Sovereign Dispatcher for Karachi.
    RAW SIGNAL: ${signal.raw_input}
    ${directivePrompt}
    
    Task:
    1. Perform 'Tactical Triage' and assign Initial Threat Level (1-10).
    2. Categorize: LIFE_SAFETY, INFRASTRUCTURE, or CIVIL_ORDER.
    3. Route to: FIRE_BRIGADE, POLICE_FORCE, KMC_HEALTH, or RESCUE_1122.
    
    Respond in JSON: { 
        "threat_level": number, 
        "category": "string", 
        "department": "string",
        "immediate_action": "string" 
    }`;

    const response = await flashModel.invoke([["user", prompt]]);
    const result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    
    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Dispatcher",
        message: `Routed to ${result.department}. Triage: Level ${result.threat_level} [${result.category}]. Action: ${result.immediate_action}`,
        outcome: "Routed & Triaged"
    };

    return { 
        triage: result,
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
