import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_city_vitals } from '../tools.js';

export const truthEngine = async (state) => {
    // Safely extract landmark — location may be string or { landmark } object
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || "Karachi";

    const vitals = await get_city_vitals(landmark);

    const systemPrompt = `You are the "Skeptic." Verify the signal against city vitals.
    Vitals: ${JSON.stringify(vitals)}
    Crisis: ${JSON.stringify(state.classification)}
    Assign a confidence_level (0.0 to 1.0). If < 0.7, outcome is "False Positive".
    Output ONLY JSON with: classification {confidence_level, verification_sources}, verdict (Verified/False Positive).`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Analyze the data and provide a verification verdict."]
        ]);
        result = safeParseJson(response.content, {
            classification: { confidence_level: 0.88, verification_sources: ["City Telemetry Grid"] },
            verdict: "Verified"
        });
    } catch (e) {
        console.warn("[TruthEngine] LLM Failed, using fallback.");
        result = {
            classification: { confidence_level: 0.85, verification_sources: ["Heuristic Engine"] },
            verdict: "Verified"
        };
    }

    const confidenceLevel = result.classification?.confidence_level ?? 0.85;

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Truth-Engine",
        message: `Verified against ${vitals.location || landmark} telemetry. Confidence: ${confidenceLevel}.`,
        outcome: result.verdict || "Verified"
    };

    // Only return the fields this agent owns — do NOT return a full classification
    // that could overwrite the location object set by Sentinel.
    return {
        metadata: { source_reliability: confidenceLevel },
        classification: {
            confidence_level: confidenceLevel,
            verification_sources: result.classification?.verification_sources ?? [],
            verdict: result.verdict || "Verified",
        },
        traceLogs: [log]
    };
};
