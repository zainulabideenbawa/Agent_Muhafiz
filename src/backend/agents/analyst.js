import { proModel } from './models.js';
import { safeParseJson } from './parser.js';
import { get_rainfall_forecast } from '../tools.js';

export const analyst = async (state) => {
    const landmark = state.classification?.location?.landmark || "Karachi";
    const lat = state.classification?.location?.lat || 24.8607;
    const lng = state.classification?.location?.lng || 67.0011;
    const isFire = (state.classification?.type || "").toLowerCase().includes("fire");
    const isFlood = (state.classification?.type || "").toLowerCase().includes("flood");

    // Fetch real 6-hour rainfall forecast from Open-Meteo (no API key needed)
    let forecast = { total_rainfall_6h_mm: 0, flood_risk: 'UNKNOWN', source: 'unavailable' };
    if (isFlood) {
        forecast = await get_rainfall_forecast(lat, lng);
        console.log(`[Analyst/Open-Meteo] Rainfall forecast: ${forecast.total_rainfall_6h_mm}mm/6h, risk=${forecast.flood_risk} (${forecast.source})`);
    }

    const systemPrompt = `You are the "Time Traveler." Predict the next 60 minutes.
    Crisis: ${JSON.stringify(state.classification)}
    ${isFlood ? `LIVE RAINFALL FORECAST (next 6h): ${JSON.stringify(forecast)}` : ''}
    Analyze spread and infrastructure risk (Indus/Aga Khan hospitals).
    Output ONLY JSON for: impact_analysis {estimated_duration, affected_population, critical_infrastructure_risk, spread_prediction, reasoning}.
    Your reasoning should explain exactly how the type of crisis (${state.classification?.type}) and the location landmark (${state.classification?.location?.landmark}) dynamically increase risks to specific hospitals, roads, or population densities in that sector.`;

    // Dynamic Intelligent Predictive Heuristics — enhanced with real forecast
    let calculatedDuration = isFire ? "2 hours" : "4 hours";
    let calculatedPopulation = isFire ? 4500 : 18000;
    let calculatedRisk = isFire ? ["Local Power Grid", "Commercial Market"] : ["Sewerage Line", "Underpass Highway"];
    let calculatedSpread = isFire ? "high" : "critical";

    // Upgrade estimates based on real Open-Meteo forecast
    if (isFlood && forecast.flood_risk === 'HIGH') {
        calculatedDuration = "8 hours";
        calculatedPopulation = 45000;
        calculatedSpread = "extreme";
        console.log(`[Analyst] 🌧️ Open-Meteo HIGH flood risk — escalating impact estimates.`);
    } else if (isFlood && forecast.flood_risk === 'MODERATE') {
        calculatedDuration = "5 hours";
        calculatedPopulation = 28000;
    }
    
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
            reasoning: `Predicted ${calculatedSpread} spread over ${calculatedDuration} affecting ${calculatedPopulation} citizens at ${landmark}. Proximity alerts issued for ${calculatedRisk.join(" & ")}.${isFlood && forecast.source !== 'unavailable' ? ` Open-Meteo 6h forecast: ${forecast.total_rainfall_6h_mm}mm total rainfall — Flood risk: ${forecast.flood_risk}.` : ''}`
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
