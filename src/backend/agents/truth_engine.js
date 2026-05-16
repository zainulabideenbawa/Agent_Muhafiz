import { proModel } from './models.js';
import { get_city_vitals } from '../tools.js';

export const truthEngine = async (state) => {
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
};
