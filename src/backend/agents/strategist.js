import { proModel } from './models.js';
import { get_resource_status } from '../tools.js';

export const strategist = async (state) => {
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
};
