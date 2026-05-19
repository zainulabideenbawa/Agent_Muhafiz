import { getPendingIncidents, updateIncidentState } from './db/index.js';
import { runSovereignLogic } from './sovereign_logic.js';

const _processing = new Set();

export async function startIncidentWorker() {
    console.log("=========================================");
    console.log("Muhafiz-X: Real-time Incident Worker Active");
    console.log("Monitoring DB for Sovereign Events...");
    console.log("=========================================");

    const poll = async () => {
        try {
            const pending = await getPendingIncidents();
            const fresh = pending.filter(inc => !_processing.has(inc.incident_id));

            if (fresh.length > 0) {
                console.log(`[Worker] ${fresh.length} new event(s) detected.`);
                for (const incident of fresh) {
                    const { incident_id, data } = incident;
                    _processing.add(incident_id);
                    await updateIncidentState(incident_id, 'PROCESSING', data);
                    runSovereignLogic(incident_id, data?.raw_input || 'No input provided')
                        .finally(() => _processing.delete(incident_id));
                }
            }
        } catch (error) {
            console.error("[Worker] Poll error:", error.message);
        }
        setTimeout(poll, 3000);
    };

    poll();
}
