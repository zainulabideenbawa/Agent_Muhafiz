import { flashModel } from './models.js';

export const dispatcher = async (state) => {
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
};
