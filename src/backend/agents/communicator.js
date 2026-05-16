import { flashModel } from './models.js';

export const communicator = async (state) => {
    const { classification } = state;

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
};
