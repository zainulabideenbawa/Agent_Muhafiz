import { getPendingIncidents, updateIncidentState } from './db/index.js';
import { runSovereignLogic } from './sovereign_logic.js';
import dotenv from 'dotenv';

dotenv.config();

async function startWorker() {
    console.log("=========================================");
    console.log("Muhafiz-X: Real-time Incident Worker Active");
    console.log("Monitoring Neon DB for Sovereign Events...");
    console.log("=========================================");

    while (true) {
        try {
            const pending = await getPendingIncidents();

            if (pending.length > 0) {
                console.log(`[Worker] Detected ${pending.length} new event(s). Wake up agents!`);

                for (const incident of pending) {
                    const { incident_id, data } = incident;
                    const input = data.raw_input || "No input provided";

                    await updateIncidentState(incident_id, 'PROCESSING', data);
                    runSovereignLogic(incident_id, input);
                }
            }
        } catch (error) {
            console.error("[Worker] Error polling events:", error.message);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

startWorker();
