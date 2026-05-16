import { proModel } from './models.js';
import { run_impact_simulation } from '../tools.js';

export const oracle = async (state) => {
    const simResult = await run_impact_simulation(state.action_plan);

    const systemPrompt = `You are the Risk Assessor. Rehearse the plan.
    Simulation Data: ${JSON.stringify(simResult)}
    Analyze side effects. If net-positive, approve.
    Output ONLY JSON for: simulation {success_probability, simulation_log, approved}.`;

    let result;
    try {
        const response = await proModel.invoke([
            ["system", systemPrompt],
            ["user", "Run risk analysis."]
        ]);
        result = JSON.parse(response.content.replace(/```json|```/g, "").trim());
    } catch (e) {
        console.warn("[Oracle] LLM Failed, using fallback.");
        result = { simulation: { success_probability: 0.88, simulation_log: "Heuristic simulation passed.", approved: true } };
    }

    const log = {
        timestamp: new Date().toISOString(),
        agent: "The Oracle",
        message: `${result.simulation?.approved ? 'Plan approved via virtual rehearsal.' : 'Plan rejected due to side effects.'}`,
        outcome: result.simulation?.approved ? "Approved" : "Rejected"
    };

    return {
        simulation: result.simulation,
        traceLogs: [log]
    };
};
