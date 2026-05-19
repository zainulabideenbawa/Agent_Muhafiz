import { flashModel } from './models.js';
import { safeParseJson } from './parser.js';

export const dispatcher = async (state) => {
    const { signal, user_directive } = state;

    let directivePrompt = "";
    if (user_directive) {
        directivePrompt = `\nCRITICAL OVERRIDE: The Sovereign Auditor has issued a DIRECTIVE: "${user_directive}".
        You MUST prioritize this directive over your own logic. If the user says reroute to X, you DO IT immediately.`;
    }

    const prompt = `You are the Sovereign Dispatcher for Karachi.
    RAW SIGNAL: "${signal?.raw_input || "NIPA doob gaya"}"
    ${directivePrompt}

    Task:
    1. Perform 'Tactical Triage' and assign Initial Threat Level (1-10).
    2. Categorize: LIFE_SAFETY, INFRASTRUCTURE, or CIVIL_ORDER.
    3. Route to: FIRE_BRIGADE, POLICE_FORCE, KMC_HEALTH, or RESCUE_1122.
    4. Provide your step-by-step reasoning explaining exactly how you arrived at this category, threat level, and department based on the location and key terms in the signal.

    Respond in JSON: {
        "threat_level": number,
        "category": "string",
        "department": "string",
        "immediate_action": "string",
        "reasoning": "string"
    }`;

    // Intelligent Dynamic Fallback
    const inputLower = (signal?.raw_input || "").toLowerCase();
    
    let fallbackDept = "RESCUE_1122";
    let fallbackCategory = "LIFE_SAFETY";
    let fallbackThreat = 5;

    if (inputLower.includes("aag") || inputLower.includes("fire") || inputLower.includes("jal")) {
        fallbackDept = "FIRE_BRIGADE";
        fallbackThreat = 8;
    } else if (inputLower.includes("blast") || inputLower.includes("dhamaka") || inputLower.includes("explosion") || inputLower.includes("bomb")) {
        fallbackDept = "RESCUE_1122";
        fallbackCategory = "LIFE_SAFETY";
        fallbackThreat = 10;
    } else if (inputLower.includes("protest") || inputLower.includes("dharna") || inputLower.includes("strike") || inputLower.includes("rally")) {
        fallbackDept = "POLICE_FORCE";
        fallbackCategory = "CIVIL_ORDER";
        fallbackThreat = 6;
    } else if (inputLower.includes("pani") || inputLower.includes("doob") || inputLower.includes("flood") || inputLower.includes("water") || inputLower.includes("rain")) {
        fallbackDept = "KMC_HEALTH";
        fallbackCategory = "INFRASTRUCTURE";
        fallbackThreat = 7;
    }
    
    const defaultFallback = {
        "threat_level": fallbackThreat,
        "category": fallbackCategory,
        "department": fallbackDept,
        "immediate_action": `Dispatched immediate units from ${fallbackDept} to address the incident.`,
        "reasoning": `Heuristic parsing detected crisis key terms in input matching department ${fallbackDept}.`
    };

    let result;
    try {
        const response = await flashModel.invoke([["user", prompt]]);
        result = safeParseJson(response.content, defaultFallback);
    } catch (e) {
        console.warn("[Dispatcher] LLM Failed or Quota Exceeded, using dynamic heuristic fallback.");
        result = defaultFallback;
    }

    console.log(`[Agent: The Dispatcher] Triage result: category=${result.category}, department=${result.department}, priority=${result.threat_level}`);
    console.log(`[Agent: The Dispatcher] Reasoning: ${result.reasoning}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Dispatcher",
        message: `Routed to ${result.department}. Triage: Level ${result.threat_level} [${result.category}]. Reasoning: ${result.reasoning}`,
        outcome: "Routed & Triaged",
        details: result
    };

    return {
        triage: result,
        assigned_department: result.department,
        traceLogs: [log]
    };
};
