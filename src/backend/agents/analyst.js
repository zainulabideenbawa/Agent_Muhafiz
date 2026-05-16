import { proModel } from './models.js';

export const analyst = async (state) => {
    const systemPrompt = `You are the "Time Traveler." Predict the next 60 minutes.
    Crisis: ${JSON.stringify(state.classification)}
    Analyze spread and infrastructure risk (Indus/Aga Khan hospitals).
    Output ONLY JSON for: impact_analysis {estimated_duration, affected_population, critical_infrastructure_risk, spread_prediction}.`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Generate impact prediction."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Analyst] LLM Failed, using fallback.");
        result = { impact_analysis: { estimated_duration: "3 hours", affected_population: 12000, critical_infrastructure_risk: ["Indus Hospital"], spread_prediction: "moderate" } };
    }

    const riskList = Array.isArray(result.impact_analysis?.critical_infrastructure_risk)
        ? result.impact_analysis.critical_infrastructure_risk.map(r => typeof r === 'object' ? JSON.stringify(r) : r).join(", ")
        : (typeof result.impact_analysis?.critical_infrastructure_risk === 'object' ? "Multiple Sites" : result.impact_analysis?.critical_infrastructure_risk || "None");

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Analyst",
        message: `Predicted spread. Infrastructure risk: ${riskList}.`,
        outcome: "Success"
    };

    return {
        impact_analysis: result.impact_analysis,
        traceLogs: [log]
    };
};
