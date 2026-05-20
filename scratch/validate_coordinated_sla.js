import { saveIncident, getIncidentById } from '../src/backend/db/incidents.js';
import { runSovereignLogic } from '../src/backend/sovereign_logic.js';
import { getAllTasks } from '../src/backend/db/tasks.js';

async function runValidation() {
    console.log("=== STARTING CO-ORDINATED SLA PIPELINE VALIDATION ===");

    const incidentId = `MHFZ-SLA-${Date.now().toString().slice(-4)}`;
    const signalText = "Severe water logging and flooding at NIPA Chowrangi, there is a k-electric electrical wire down and people are reporting sparks and electrocution risk!";

    console.log(`[Validation] Triggering test incident ${incidentId} with signal: "${signalText}"`);

    // 1. Save the incident in the database/local store
    await saveIncident(incidentId, "UNKNOWN", "ANALYZING", signalText);

    // 2. Run the autonomous pipeline
    console.log("[Validation] Running Autonomous Sovereign Logic...");
    const pipelineResult = await runSovereignLogic(incidentId, signalText);

    console.log("[Validation] Pipeline complete. Result:", pipelineResult);

    // 3. Retrieve the incident details
    const incident = await getIncidentById(incidentId);
    if (!incident) {
        console.error("❌ FAILED: Incident not found in database/local_store!");
        process.exit(1);
    }

    console.log("\n=== VALIDATING ENHANCEMENTS STATE LOGS ===");

    const data = incident.data || {};
    const classification = data.classification || {};
    const assignedDept = data.assigned_department || "";
    const secondaryHazards = classification.secondary_hazards || data.secondary_hazards || [];
    const coordinatedSla = data.coordinated_sla || {};

    console.log("1. Sentinel Classification & Hazards:");
    console.log(`   - Type: ${classification.type} (Expected: flood)`);
    console.log(`   - Location: ${classification.location?.landmark}`);
    console.log(`   - Secondary Hazards: ${JSON.stringify(secondaryHazards)}`);

    console.log("2. Dispatcher Routing:");
    console.log(`   - Assigned Department: ${assignedDept} (Expected: COORDINATED_SLA)`);
    console.log(`   - Coordinated SLA Object: ${JSON.stringify(coordinatedSla, null, 2)}`);

    // 4. Assertions on Incident
    let failed = false;

    if (!secondaryHazards.includes('exposed_electrical_wires')) {
        console.error("❌ ASSERTION FAILED: Secondary hazards do not include 'exposed_electrical_wires'");
        failed = true;
    }

    if (assignedDept !== 'COORDINATED_SLA') {
        console.error("❌ ASSERTION FAILED: Assigned department is not 'COORDINATED_SLA'");
        failed = true;
    }

    // 5. Verify task spawning
    console.log("\n=== VALIDATING 3-WAY TASK TICKETS IN TASK STORE ===");
    const allTasks = await getAllTasks();
    const activeTasks = allTasks.filter(t => t.incident_ref === incidentId);
    
    console.log(`   - Found ${activeTasks.length} spawned tasks for incident ${incidentId}:`);
    for (const task of activeTasks) {
        console.log(`     * Task ID: ${task.task_id} | Agent: ${task.assigned_agent} | Status: ${task.status} | Objective: "${task.mission_objective}"`);
    }

    if (activeTasks.length < 3) {
        console.error(`❌ ASSERTION FAILED: Expected at least 3 active tasks for incident, found ${activeTasks.length}`);
        failed = true;
    }

    const expectedAgents = ['Rescue 1122', 'K-Electric', 'Traffic Police'];
    for (const agent of expectedAgents) {
        const agentTask = activeTasks.find(t => t.assigned_agent === agent);
        if (!agentTask) {
            console.error(`❌ ASSERTION FAILED: Mission task for agent '${agent}' not found!`);
            failed = true;
        } else {
            console.log(`   - Verified task spawned correctly for '${agent}'`);
        }
    }

    if (failed) {
        console.log("\n❌ VALIDATION TEST SUITE FAILED!");
        process.exit(1);
    } else {
        console.log("\n✅ ALL ASSERTIONS PASSED! Coordinated SLAs & 3-way parallel task spawning working flawlessly.");
        process.exit(0);
    }
}

runValidation().catch(e => {
    console.error("Fatal Error running validation:", e);
    process.exit(1);
});
