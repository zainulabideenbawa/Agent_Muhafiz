import { proModel } from './models.js';
import { safeParseJson } from './parser.js';

export const analyst = async (state) => {
    const systemPrompt = `You are the "Time Traveler." Predict the next 60 minutes.
    Crisis: ${JSON.stringify(state.classification)}
    Analyze spread and infrastructure risk (Indus/Aga Khan hospitals).
    Output ONLY JSON for: impact_analysis {estimated_duration, affected_population, critical_infrastructure_risk, spread_prediction, reasoning}.
    Your reasoning should explain exactly how the type of crisis (${state.classification?.type}) and the location landmark (${state.classification?.location?.landmark}) dynamically increase risks to specific hospitals, roads, or population densities in that sector.`;

    // Dynamic Intelligent Predictive Heuristics
    const landmark = state.classification?.location?.landmark || "Karachi";
    const isFire = (state.classification?.type || "").toLowerCase().includes("fire");
    
    let calculatedDuration = isFire ? "2 hours" : "4 hours";
    let calculatedPopulation = isFire ? 4500 : 18000; // Floods block wider grids
    let calculatedRisk = isFire ? ["Local Power Grid", "Commercial Market"] : ["Sewerage Line", "Underpass Highway"];
    let calculatedSpread = isFire ? "high" : "critical";
    
    // Customize hospital risk based on location proximity
    if (landmark.toLowerCase().includes("liaquatabad")) {
        calculatedRisk.push("Abbasi Shaheed Hospital");
    } else if (landmark.toLowerCase().includes("nipa") || landmark.toLowerCase().includes("gulshan")) {
        calculatedRisk.push("Aga Khan Hospital");
    } else {
        calculatedRisk.push("Indus Hospital");
    }

    const defaultFallback = {
        impact_analysis: {
            estimated_duration: calculatedDuration,
            affected_population: calculatedPopulation,
            critical_infrastructure_risk: calculatedRisk,
            spread_prediction: calculatedSpread,
            reasoning: `Predicted ${calculatedSpread} spread over ${calculatedDuration} affecting ${calculatedPopulation} citizens at ${landmark}. Proximity alerts issued for ${calculatedRisk.join(" & ")}.`
        }
    };

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Generate impact prediction."]
        ]);
        result = safeParseJson(response.content, defaultFallback);
    } catch (e) {
        console.warn("[Analyst] LLM Failed, using fallback.");
        result = defaultFallback;
    }

    const riskList = Array.isArray(result.impact_analysis?.critical_infrastructure_risk)
        ? result.impact_analysis.critical_infrastructure_risk.map(r => typeof r === 'object' ? JSON.stringify(r) : r).join(", ")
        : (typeof result.impact_analysis?.critical_infrastructure_risk === 'object' ? "Multiple Sites" : result.impact_analysis?.critical_infrastructure_risk || "None");

    console.log(`[Agent: The Analyst] Predict: duration=${result.impact_analysis?.estimated_duration}, affected=${result.impact_analysis?.affected_population}, risk=${riskList}`);
    console.log(`[Agent: The Analyst] Reasoning: ${result.impact_analysis?.reasoning || "Fallback heuristics applied."}`);

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
