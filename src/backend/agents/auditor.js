import { flashModel } from './models.js';

export const auditor = async (state) => {
    const prompt = `You are the Sovereign Auditor. The mission at ${state.classification.location.landmark} is complete.

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

    const response = await flashModel.invoke([["user", prompt]]);
    const result = JSON.parse(response.content.replace(/```json|```/g, "").trim());

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
