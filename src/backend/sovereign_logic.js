import { muhafizGraph } from './agents/index.js';
import { broadcast } from './websocket.js';
import { updateIncidentState, insertTask } from './db/index.js';

export let activeUserDirective = null;

export const setUserDirective = (directive) => {
    activeUserDirective = directive;
};

export const runSovereignLogic = async (incidentId, input) => {
    console.log(`[Autonomous Logic] Initiating Agents for ${incidentId}`);

    try {
        const initialState = {
            signal: { raw_input: input || "NIPA doob gaya" },
            user_directive: activeUserDirective,
            metadata: { incidentId },
            traceLogs: []
        };

        const stream = await muhafizGraph.stream(initialState);
        let assignedDept = null;
        let finalState = { ...initialState };

        for await (const chunk of stream) {
            const nodeName = Object.keys(chunk)[0];
            const stateUpdate = chunk[nodeName];

            if (!stateUpdate || typeof stateUpdate !== 'object') continue;

            console.log(`\n[Autonomous Logic] 🧠 [Node: ${nodeName}] Processing completed.`);
            if (nodeName === 'TheDispatcher' && stateUpdate.assigned_department) {
                console.log(`[Autonomous Logic]   -> Routed Department: ${stateUpdate.assigned_department}`);
                console.log(`[Autonomous Logic]   -> Initial Threat Level: ${stateUpdate.triage?.threat_level || 5}`);
                console.log(`[Autonomous Logic]   -> Action: ${stateUpdate.triage?.immediate_action || "Dispatched"}`);
            }
            if (nodeName === 'TheSentinel' && stateUpdate.classification) {
                console.log(`[Autonomous Logic]   -> Crisis Active: ${stateUpdate.classification.is_crisis}`);
                console.log(`[Autonomous Logic]   -> Target Location: ${stateUpdate.classification.location?.landmark}`);
                console.log(`[Autonomous Logic]   -> Urgency Score: ${stateUpdate.classification.urgency}`);
            }
            if (nodeName === 'TheTruthEngine' && stateUpdate.classification) {
                console.log(`[Autonomous Logic]   -> Verification: ${stateUpdate.classification.verdict}`);
                console.log(`[Autonomous Logic]   -> Telemetry Confidence: ${stateUpdate.classification.confidence_level}`);
                console.log(`[Autonomous Logic]   -> Verified Sources: ${stateUpdate.classification.verification_sources?.join(", ")}`);
            }
            if (nodeName === 'TheAnalyst' && stateUpdate.impact_analysis) {
                console.log(`[Autonomous Logic]   -> Duration: ${stateUpdate.impact_analysis.estimated_duration}`);
                console.log(`[Autonomous Logic]   -> Impacted Population: ${stateUpdate.impact_analysis.affected_population}`);
                console.log(`[Autonomous Logic]   -> Infrastructure at Risk: ${stateUpdate.impact_analysis.critical_infrastructure_risk?.join(", ")}`);
            }
            if (nodeName === 'TheStrategist' && stateUpdate.action_plan) {
                console.log(`[Autonomous Logic]   -> Operational Hub: ${stateUpdate.action_plan.deployment?.hub}`);
                console.log(`[Autonomous Logic]   -> Allocated Fleet: ${stateUpdate.action_plan.deployment?.units?.join(", ")}`);
                console.log(`[Autonomous Logic]   -> Deployment ETA: ${stateUpdate.action_plan.deployment?.eta_mins} mins`);
                console.log(`[Autonomous Logic]   -> Directive: ${stateUpdate.action_plan.tactical_directive}`);
            }
            if (nodeName === 'TheOracle' && stateUpdate.simulation) {
                console.log(`[Autonomous Logic]   -> Rehearsal Approval: ${stateUpdate.simulation.approved ? 'APPROVED' : 'REJECTED'}`);
                console.log(`[Autonomous Logic]   -> Success Probability: ${(stateUpdate.simulation.success_probability * 100).toFixed(0)}%`);
                console.log(`[Autonomous Logic]   -> Virtual Rehearsal Log: ${stateUpdate.simulation.simulation_log}`);
            }
            if (nodeName === 'TheCommunicator' && stateUpdate.communication) {
                console.log(`[Autonomous Logic]   -> Alert Radius: ${stateUpdate.communication.radius_km} km`);
                console.log(`[Autonomous Logic]   -> Dispatch SMS Draft: "${stateUpdate.communication.whatsapp_draft?.en}"`);
            }
            if (nodeName === 'TheAuditor' && stateUpdate.audit_result) {
                console.log(`[Autonomous Logic]   -> Resolution State: ${stateUpdate.audit_result.status}`);
                console.log(`[Autonomous Logic]   -> Sovereign Performance Index: ${stateUpdate.audit_result.performance_score}%`);
                console.log(`[Autonomous Logic]   -> Urban Policy Directives: ${stateUpdate.audit_result.policy_recommendation}`);
            }

            if (stateUpdate.assigned_department) assignedDept = stateUpdate.assigned_department;

            // Deep-merge classification so location.landmark is never clobbered by a
            // downstream agent returning a flat classification object.
            const mergedClassification = (finalState.classification || stateUpdate.classification)
                ? {
                    ...(finalState.classification || {}),
                    ...(stateUpdate.classification || {}),
                    location: (
                        stateUpdate.classification?.location &&
                        typeof stateUpdate.classification.location === 'object'
                    )
                        ? stateUpdate.classification.location
                        : (finalState.classification?.location || { landmark: 'Karachi' })
                }
                : finalState.classification;

            finalState = {
                ...finalState,
                ...stateUpdate,
                classification: mergedClassification,
            };

            if (stateUpdate?.traceLogs?.length > 0) {
                const latestLog = stateUpdate.traceLogs[stateUpdate.traceLogs.length - 1];
                broadcast({ type: 'TRACE_LOG', incidentId, assigned_department: assignedDept, log: latestLog });
            }

            if (nodeName === 'TheCommunicator' && stateUpdate.communication) {
                broadcast({ type: 'COMMUNICATION_ALERT', incidentId, assigned_department: assignedDept, data: stateUpdate.communication });
            }

            await updateIncidentState(incidentId, 'PROCESSING', finalState);
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        await updateIncidentState(incidentId, 'RESOLVED', finalState);

        if (finalState.deployment) {
            await insertTask({
                task_id: 'TSK-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
                incident_ref: incidentId,
                status: 'ON_SCENE',
                assigned_agent: 'The Dispatcher',
                mission_objective: finalState.deployment.logic || 'Urban Emergency Response',
                priority_level: finalState.deployment.threat_level || 5,
            });
            console.log(`[Sovereign] Task Spawned for ${incidentId}`);
        }

        await updateIncidentState(incidentId, 'COMPLETED', finalState);
        console.log(`[Autonomous Logic] Mission ${incidentId} Complete.`);
        return { success: true };
    } catch (error) {
        console.error(`[Autonomous Logic] Error:`, error);
        await updateIncidentState(incidentId, 'FAILED', { error: error.message });
        return { success: false, error: error.message };
    }
};
