import { flashModel } from './models.js';
import { safeParseJson } from './parser.js';

const POLICY_RECOMMENDATIONS = {
    fire: {
        saddar: 'Install automated fire suppression systems in Empress Market and Boulton Market heritage structures. Mandate LPG storage compliance audits across all commercial vendors in Saddar district. Establish a dedicated fire hydrant maintenance schedule on M.A. Jinnah Road.',
        nipa: 'Mandate fire-rated building materials in all new constructions within 500m of Aga Khan Hospital. Install smart smoke-detection network across Gulshan-e-Iqbal high-rise corridor. Establish a fire safety compliance office at NIPA Chowrangi.',
        default: 'Conduct mandatory fire safety audits for all commercial buildings above 3 storeys in the affected zone. Install 10 additional fire hydrants on primary response routes. Create a fire-safety awareness programme for market vendors.',
    },
    flood: {
        nipa: 'Dredge NIPA Chowrangi KDA drain (confirmed capacity: 40% of design spec). Install automated sluice gate at NIPA underpass linked to real-time rainfall sensors. Deploy permanent pump stations at NIPA and University Road intersection.',
        karsaz: 'Rebuild Karsaz underpass with raised lip threshold (+45cm). Install automated flood barriers at Karsaz underpass entrance. Implement real-time water-level sensors linked to MTCE traffic signal system to auto-close underpass early.',
        gulshan: 'Desilt Block 13 KDA nala (last desilted 2019). Increase drain cross-section from 1.2m to 2.5m at the Block 13 bottleneck. Install IoT water-level sensors triggering SMS alerts at 15cm water-depth.',
        default: 'Commission an independent drainage capacity audit for the affected zone. Desilt all KDA primary drains before monsoon season. Install automated pump stations at the 5 historically worst waterlogging points.',
    },
    blast: {
        default: 'Install blast-resistant street furniture and CCTV-AEI (Automatic Event Identification) cameras at all major Karachi intersections. Upgrade CTD early warning intel-sharing with civilian emergency services. Conduct quarterly bomb disposal exercises with 1122 and KFB.',
    },
    protest: {
        university_road: 'Designate University Road as a "Protest Corridor" with designated assembly zones away from hospital ambulance routes. Install permanent traffic diversion signage on Rashid Minhas Road for University Road closure scenarios. Create a 24/7 rapid-deployment traffic management cell.',
        default: 'Establish a Karachi Protest Management Protocol: mandatory 48-hour notice requirement for all planned marches, mandatory alternate route clearance, and hospital corridor preservation agreement with protest organisers.',
    },
};

const getPolicy = (crisisType, landmark) => {
    const lmLower = (landmark || '').toLowerCase();
    const policies = POLICY_RECOMMENDATIONS[crisisType] || POLICY_RECOMMENDATIONS.flood;
    for (const [zone, policy] of Object.entries(policies)) {
        if (zone !== 'default' && lmLower.includes(zone)) return policy;
    }
    return policies.default || POLICY_RECOMMENDATIONS.flood.default;
};

export const auditor = async (state) => {
    const loc = state.classification?.location;
    const landmark = (loc && typeof loc === 'object' ? loc.landmark : loc) || 'Karachi';
    const crisisType = (state.classification?.type || 'flood').toLowerCase();
    const urgency = state.classification?.urgency || 7;
    const etaMins = state.action_plan?.deployment?.eta_mins || 15;
    const hub = state.action_plan?.deployment?.hub || 'Central Hub';
    const dept = (state.assigned_department || 'Emergency Services').replace(/_/g, ' ');
    const confidence = state.classification?.confidence_level ?? 0.85;
    const simApproved = state.simulation?.approved ?? true;
    const simProb = state.simulation?.success_probability ?? 0.88;

    const policyRec = getPolicy(crisisType, landmark);

    // Compute performance score from multiple factors
    const etaScore = etaMins <= 10 ? 100 : etaMins <= 15 ? 88 : etaMins <= 20 ? 75 : etaMins <= 30 ? 60 : 45;
    const confidenceScore = Math.round(confidence * 100);
    const simScore = Math.round(simProb * 100);
    const urgencyBonus = urgency >= 9 ? 5 : urgency >= 7 ? 2 : 0;
    const performanceScore = Math.min(99, Math.round((etaScore + confidenceScore + simScore) / 3) + urgencyBonus);

    const learningLog = `SOVEREIGN PERFORMANCE AUDIT — ${landmark} ${crisisType.toUpperCase()} Response\n` +
        `• Response initiated from: ${hub}\n` +
        `• ETA to scene: ${etaMins} min (benchmark: 12 min) — ${etaMins <= 12 ? '✅ Within SLA' : '⚠️ Exceeded SLA by ' + (etaMins - 12) + ' min'}\n` +
        `• Signal confidence: ${confidenceScore}% (threshold: 80%) — ${confidence >= 0.8 ? '✅ Passed' : '⚠️ Below threshold — HITL deployed'}\n` +
        `• Virtual rehearsal: ${simApproved ? '✅ Approved' : '⚠️ Flagged'} (${simScore}% success probability)\n` +
        `• Overall Sovereign Performance Index: ${performanceScore}%\n` +
        `• Primary bottleneck: ${etaMins > 15 ? 'Response ETA exceeded — consider pre-positioning units in ' + crisisType + '-prone zones' : 'None identified — response within operational parameters'}\n` +
        `• Archived to Muhafiz-X Urban Intelligence Database at ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`;

    const heuristicResult = {
        status: 'RESOLVED',
        performance_score: performanceScore,
        policy_recommendation: policyRec,
        learning_log: learningLog,
        kpi_breakdown: {
            eta_score: etaScore,
            confidence_score: confidenceScore,
            simulation_score: simScore,
            overall: performanceScore,
        }
    };

    const prompt = `You are the Sovereign Auditor for Muhafiz-X Karachi Emergency OS.
    CRISIS: ${crisisType.toUpperCase()} at ${landmark}
    RESPONSE SUMMARY: ${dept} deployed from ${hub} — ETA ${etaMins} min
    CONFIDENCE: ${confidenceScore}% | SIM RESULT: ${simScore}% | URGENCY: ${urgency}/10
    
    TASK — Be specific to ${landmark}:
    1. Verify RESOLVED vs ACTIVE.
    2. Compute performance score (0-100) with breakdown: ETA vs benchmark, confidence, simulation.
    3. Recommend ONE specific, actionable long-term infrastructure policy for ${landmark} to prevent this type of crisis.
    4. Write a learning log entry for the Muhafiz-X Urban Intelligence Database.
    
    Respond ONLY in valid JSON: { "status": "RESOLVED"|"ACTIVE", "performance_score": number, "policy_recommendation": string, "learning_log": string }`;

    let result;
    try {
        const response = await flashModel.invoke([['user', prompt]]);
        result = safeParseJson(response.content, heuristicResult);
    } catch (e) {
        console.warn('[Auditor] LLM unavailable — using performance heuristic audit engine.');
        result = heuristicResult;
    }

    // Always preserve our detailed KPI breakdown
    result.kpi_breakdown = heuristicResult.kpi_breakdown;

    console.log(`[Agent: The Auditor] Audit: status=${result.status}, score=${result.performance_score}%, policy="${result.policy_recommendation?.substring(0, 80)}..."`);

    const log = {
        timestamp: new Date().toISOString(),
        agent: 'The Auditor',
        message: `📋 Mission ${result.status}. Sovereign Performance Index: ${result.performance_score}%. ` +
            `ETA score: ${heuristicResult.kpi_breakdown.eta_score}% | Confidence: ${confidenceScore}% | Sim: ${simScore}%. ` +
            `Policy recommendation logged to Urban Intelligence Database.`,
        outcome: result.status === 'RESOLVED' ? 'Mission Complete' : 'Active Monitoring',
        details: result,
    };

    return {
        audit_result: result,
        traceLogs: [log],
    };
};
