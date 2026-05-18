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
    1. Select the exact HUB for deployment.
    2. Specify units (e.g., Heavy Tanker, Life-Support Ambulance).
    3. Calculate ETA based on traffic (${confidenceStr} sensor accuracy).
    4. Provide a 'Tactical Directive' for field staff (including traffic diversions).

    Respond in JSON: {
        "priority_level": "CRITICAL" | "STANDARD",
        "deployment": { "hub": "string", "units": ["string"], "eta_mins": number },
        "tactical_directive": "string",
        "inter_agency_coordination": "string"
    }`;

    const response = await proModel.invoke([["user", prompt]]);
    const result = safeParseJson(response.content, {
        priority_level: "CRITICAL",
        deployment: {
            hub: "Karachi Central Station",
            units: ["Heavy Water Tanker", "Rescue Team Alpha"],
            eta_mins: 12
        },
        tactical_directive: "Establish immediate cordons and secure clear bypass routes.",
        inter_agency_coordination: "Police forces to manage secondary street diversions."
    });

    const unitsDispatched = Array.isArray(result.deployment?.units)
        ? result.deployment.units.join(", ")
        : "Rescue Units";

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Strategist",
        message: `TACTICAL DIRECTIVE: ${unitsDispatched} dispatched from ${result.deployment?.hub || "Central Hub"}. ETA: ${result.deployment?.eta_mins || 15} mins. ${result.tactical_directive || ""}`,
        outcome: "Plan Locked"
    };

    return {
        action_plan: result,
        deployment: result.deployment,
        traceLogs: [log]
    };
};
