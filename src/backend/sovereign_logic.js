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

            if (stateUpdate.assigned_department) assignedDept = stateUpdate.assigned_department;

            finalState = { ...finalState, ...stateUpdate };

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
