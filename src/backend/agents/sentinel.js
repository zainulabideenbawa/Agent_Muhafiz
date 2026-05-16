import { flashModel } from './models.js';

export const sentinel = async (state) => {
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
};
