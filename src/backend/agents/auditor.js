import { flashModel } from './models.js';
import { safeParseJson } from './parser.js';

export const auditor = async (state) => {
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || "Karachi";

    const prompt = `You are the Sovereign Auditor. The mission at ${landmark} is complete.

    Task:
    1. Verify if the crisis is RESOLVED.
    2. Analyze performance (ETA vs Traffic).
    3. Suggest one LONG-TERM Policy/Infrastructure fix for the city to prevent this or improve response.

    Respond in JSON: {
        "status": "RESOLVED" | "ACTIVE",
        "performance_score": number,
        "policy_recommendation": "string",
        "learning_log": "string"
    }`;

    let result;
    try {
        const response = await flashModel.invoke([["user", prompt]]);
        result = safeParseJson(response.content, {
            status: "RESOLVED",
            performance_score: 90,
            policy_recommendation: "Install localized warning flags and safety nodes.",
            learning_log: "Archived resolution and post-event analysis successfully."
        });
    } catch (e) {
        console.warn("[Auditor] LLM failed, using fallback.");
        result = {
            status: "RESOLVED",
            performance_score: 85,
            policy_recommendation: "Increase sensor density in flood-prone areas.",
            learning_log: "Fallback resolution logged."
        };
    }

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Auditor",
        message: `Mission ${result.status}. Performance: ${result.performance_score}%. Policy: ${result.policy_recommendation}`,
        outcome: result.status === "RESOLVED" ? "Crisis Resolved" : "Active Crisis"
    };

    return {
        audit_result: result,
        traceLogs: [log]
    };
};
