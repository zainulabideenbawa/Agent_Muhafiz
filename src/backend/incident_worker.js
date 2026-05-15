import { getPendingIncidents, updateIncidentState } from './db.js';
import { runSovereignLogic } from './server.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MUHAFIZ-X: SOVEREIGN INCIDENT WORKER
 * This background service polls the Neon Database for new events 
 * (from the Mobile App or OSINT Uplink) and wakes up the Sovereign Agents.
 */

async function startWorker() {
    console.log("=========================================");
    console.log("Muhafiz-X: Real-time Incident Worker Active");
    console.log("Monitoring Neon DB for Sovereign Events...");
    console.log("=========================================");

    // Infinite Loop for Event Detection
    while (true) {
        try {
            const pending = await getPendingIncidents();
            
            if (pending.length > 0) {
                console.log(`[Worker] Detected ${pending.length} new event(s). Wake up agents!`);
                
                for (const incident of pending) {
                    const { incident_id, data } = incident;
                    const input = data.raw_input || "No input provided";

                    // Update to 'PROCESSING' so other workers don't pick it up
                    await updateIncidentState(incident_id, 'PROCESSING', data);
                    
                    // Trigger the Autonomous Agent Flow
                    // We run it without 'await' so multiple incidents can be processed in parallel
                    runSovereignLogic(incident_id, input);
                }
            }
        } catch (error) {
            console.error("[Worker] Error polling events:", error.message);
        }

        // Poll every 3 seconds
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

startWorker();
