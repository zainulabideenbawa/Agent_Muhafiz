import { flashModel } from './models.js';
import { safeParseJson } from './parser.js';

export const communicator = async (state) => {
    const { classification, assigned_department } = state;

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
    const loc = classification?.location?.landmark || 'Karachi';
    const type = (classification?.type || 'emergency').toLowerCase();
    const dept = (assigned_department || 'Emergency Services').replace(/_/g, ' ');

    const dynamicFallback = {
        scope: classification?.urgency >= 8 ? 'GLOBAL' : 'LOCAL',
        radius_km: classification?.urgency >= 8 ? 15 : 5,
        push_notification: {
            en: `⚠️ ${type.toUpperCase()} alert at ${loc}. ${dept} units deployed. Stay clear of the area.`,
            ur: `⚠️ ${loc} mein ${type} ki surat-e-haal. ${dept} rawana ho gaye. علاقہ خالی کریں۔`
        },
        whatsapp_draft: {
            en: `🚨 MUHAFIZ-X ALERT\nIncident: ${type.toUpperCase()}\nLocation: ${loc}\nResponse: ${dept} units are en route.\nEstimated response: 14 mins\nStay safe and follow official instructions.`,
            ur: `🚨 محافظ-X الرٹ\nواقعہ: ${type}\nمقام: ${loc}\nجواب: ${dept} روانہ ہو چکے ہیں۔\nمحفوظ رہیں۔`
        },
        mayor_brief: `Mayor, a ${type} incident has been confirmed at ${loc}. ${dept} has been deployed with an estimated ETA of 14 minutes. Situation is being monitored.`
    };

    try {
        const response = await flashModel.invoke([
            ["system", systemPrompt],
            ["user", `Crisis: ${classification?.type || 'Emergency'} at ${classification?.location?.landmark || 'Karachi'}`]
        ]);
        result = safeParseJson(response.content, dynamicFallback);
    } catch (e) {
        console.warn("[Communicator] LLM Failed, using fallback.");
        result = dynamicFallback;
    }

    console.log(`[Agent: The Communicator] Broadcast scope: ${result.scope} (${result.radius_km}km). Push EN: "${result.push_notification?.en}"`);

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
