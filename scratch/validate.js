import { saveIncident, getIncidentById } from '../src/backend/db/incidents.js';
import { runSovereignLogic } from '../src/backend/sovereign_logic.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runValidation() {
    console.log("=== STARTING MUHAFIZ-X PIPELINE UPGRADE VALIDATION ===");
    
    const incidentId = `MHFZ-TEST-${Date.now().toString().slice(-4)}`;
    const signalText = "Pre-storm telemetry warning: Sewer blockage detected along BRT Red Line corridor on University Road before heavy rains (35mm forecast).";
    
    console.log(`[Validation] Triggering test incident ${incidentId} with signal: "${signalText}"`);
    
    // Save the incident
    await saveIncident(incidentId, "UNKNOWN", "ANALYZING", signalText);
    
    // Run the pipeline
    console.log("[Validation] Running Autonomous Sovereign Logic...");
    const pipelineResult = await runSovereignLogic(incidentId, signalText);
    
    console.log("[Validation] Pipeline complete. Result:", pipelineResult);
    
    // Retrieve the incident details from DB / local_store
    const incident = await getIncidentById(incidentId);
    if (!incident) {
        console.error("❌ FAILED: Incident not found in database!");
        process.exit(1);
    }
    
    console.log("\n=== VALIDATING ENHANCEMENTS STATE LOGS ===");
    
    const data = incident.data || {};
    const classification = data.classification || {};
    const assignedDept = data.assigned_department || "";
    const actionPlan = data.action_plan || {};
    const communication = data.communication || {};
    
    console.log("1. Sentinel Classification:");
    console.log(`   - Type: ${classification.type} (Expected: proactive_maintenance)`);
    console.log(`   - Urgency: ${classification.urgency} (Expected: 5)`);
    console.log(`   - Location: ${classification.location?.landmark}`);
    
    console.log("2. Truth-Engine Verification Bypass:");
    console.log(`   - Verdict: ${classification.verdict} (Expected: Verified)`);
    console.log(`   - Confidence Level: ${classification.confidence_level} (Expected: 0.95)`);
    
    console.log("3. Dispatcher Routing:");
    console.log(`   - Assigned Department: ${assignedDept} (Expected: KWSC_FWO)`);
    console.log(`   - Triage Threat Level: ${data.triage?.threat_level} (Expected: 5)`);
    
    console.log("4. Strategist Depot and Resource Allocation:");
    console.log(`   - Operational Hub: ${actionPlan.deployment?.hub}`);
    console.log(`   - Allocated Units: ${actionPlan.deployment?.units?.join(', ')}`);
    console.log(`   - Reasoning Content Check: ${actionPlan.reasoning?.includes('Priority Score') ? 'PASSED (Priority Score Formula logged)' : 'FAILED'}`);
    
    console.log("5. Communicator Silent Mode:");
    console.log(`   - Scope: ${communication.scope} (Expected: SILENT)`);
    console.log(`   - Radius KM: ${communication.radius_km} (Expected: 0)`);
    console.log(`   - Push Alert EN: "${communication.push_notification?.en}" (Expected: "")`);
    console.log(`   - WhatsApp Alert EN: "${communication.whatsapp_draft?.en}" (Expected: "")`);
    console.log(`   - Mayor's Brief: "${communication.mayor_brief}"`);
    
    // Perform assertions
    let failed = false;
    
    if (classification.type !== 'proactive_maintenance') {
        console.error("❌ ASSERTION FAILED: Classification type is not proactive_maintenance");
        failed = true;
    }
    if (classification.urgency !== 5) {
        console.error("❌ ASSERTION FAILED: Urgency is not 5");
        failed = true;
    }
    if (classification.verdict !== 'Verified' || classification.confidence_level !== 0.95) {
        console.error("❌ ASSERTION FAILED: Truth-Engine did not lock confidence at 0.95 / Verified");
        failed = true;
    }
    if (assignedDept !== 'KWSC_FWO') {
        console.error("❌ ASSERTION FAILED: Department is not KWSC_FWO");
        failed = true;
    }
    if (communication.scope !== 'SILENT' || communication.radius_km !== 0) {
        console.error("❌ ASSERTION FAILED: Communicator scope is not SILENT or radius_km is not 0");
        failed = true;
    }
    if (communication.push_notification?.en !== "" || communication.whatsapp_draft?.en !== "") {
        console.error("❌ ASSERTION FAILED: Public notifications were not suppressed");
        failed = true;
    }
    if (!communication.mayor_brief || !communication.mayor_brief.includes("KWSC") || !communication.mayor_brief.includes("FWO")) {
        console.error("❌ ASSERTION FAILED: Mayor brief does not contain secure private details");
        failed = true;
    }
    
    if (failed) {
        console.log("\n❌ VALIDATION TEST SUITE FAILED!");
        process.exit(1);
    } else {
        console.log("\n✅ ALL ASSERTIONS PASSED! Predictive Maintenance Silent Mode & Contention Engine working perfectly.");
        process.exit(0);
    }
}

runValidation().catch(e => {
    console.error("Fatal Error running validation:", e);
    process.exit(1);
});
