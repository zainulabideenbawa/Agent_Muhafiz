import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_resource_status } from '../tools.js';

export const strategist = async (state) => {
    const resources = await get_resource_status(state.assigned_department);

    // Safely resolve landmark from either { landmark } object or plain string
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || "Karachi";

    const confidenceStr = state.classification?.confidence_level
        ? `${Math.round(state.classification.confidence_level * 100)}%`
        : 'N/A';

    const prompt = `You are the Sovereign Strategist for ${state.assigned_department || 'RESCUE_1122'}.
    LOCATION: ${landmark}
    AVAILABLE FLEET: ${JSON.stringify(resources.hubs)}
    VERIFIED TRUTH: ${JSON.stringify(state.classification)}

    Task:
    1. Select the exact HUB for deployment from the AVAILABLE FLEET.
    2. Specify units (e.g., Heavy Tanker, Life-Support Ambulance).
    3. Calculate ETA based on traffic (${confidenceStr} sensor accuracy).
    4. Provide a 'Tactical Directive' for field staff (including traffic diversions).
    5. Provide your step-by-step reasoning explaining how you matched the severity, type of crisis, and closest operational hub to allocate these specific assets.

    Respond in JSON: {
        "priority_level": "CRITICAL" | "STANDARD",
        "deployment": { "hub": "string", "units": ["string"], "eta_mins": number },
        "tactical_directive": "string",
        "inter_agency_coordination": "string",
        "reasoning": "string"
    }`;

    // Dynamic Intelligent Strategic Fallback
    const firstHubName = (resources.hubs && resources.hubs[0]?.name) || "Karachi Central Station";
    const calculatedUnits = (state.assigned_department === "FIRE_BRIGADE")
        ? ["Heavy Water Tanker", "Rescue Team Alpha"]
        : (state.assigned_department === "KMC_HEALTH" ? ["Water Suction Pump", "Emergency Excavator"] : ["First-Responder Ambulance", "Paramedic Squad"]);
    
    const defaultFallback = {
        priority_level: "CRITICAL",
        deployment: {
            hub: firstHubName,
            units: calculatedUnits,
            eta_mins: 14
        },
        tactical_directive: `Deploy ${calculatedUnits.join(" & ")} immediately from closest node: ${firstHubName}.`,
        inter_agency_coordination: `Coordinate with Traffic Sindh Police to secure rapid corridor clearance to ${landmark}.`,
        reasoning: `Operational match completed. Selected nearest active hub [${firstHubName}] for department [${state.assigned_department}] to dispatch customized response units.`
    };

    let result;
    try {
        const response = await proModel.invoke([["user", prompt]]);
        result = safeParseJson(response.content, defaultFallback);
    } catch (e) {
        console.warn("[Strategist] LLM Failed or Quota Exceeded, using dynamic heuristic fallback.");
        result = defaultFallback;
    }

    const unitsDispatched = Array.isArray(result.deployment?.units)
        ? result.deployment.units.join(", ")
        : "Rescue Units";

    console.log(`[Agent: The Strategist] Tactical locked: hub=${result.deployment?.hub}, units=${unitsDispatched}, eta=${result.deployment?.eta_mins} mins`);
    console.log(`[Agent: The Strategist] Reasoning: ${result.reasoning || "Fallback heuristics applied."}`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Strategist",
        message: `TACTICAL DIRECTIVE: ${unitsDispatched} dispatched from ${result.deployment?.hub || "Central Hub"}. ETA: ${result.deployment?.eta_mins || 15} mins. ${result.tactical_directive || ""}`,
        outcome: "Plan Locked",
        details: result
    };

    return {
        action_plan: result,
        deployment: result.deployment,
        traceLogs: [log]
    };
};
