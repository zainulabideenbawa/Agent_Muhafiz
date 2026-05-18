import { db } from '../src/backend/db/connection.js';
import { department_hubs, command_profiles, mission_tasks } from '../src/backend/db/schema.js';

console.log("=========================================");
console.log("Drizzle Connection & Schema Verification");
console.log("=========================================");
console.log("DB status:", db ? "Connected" : "Not connected (DATABASE_URL empty)");
console.log("department_hubs table object:", typeof department_hubs !== 'undefined' ? "Loaded successfully" : "FAILED to load");
console.log("command_profiles table object:", typeof command_profiles !== 'undefined' ? "Loaded successfully" : "FAILED to load");
console.log("mission_tasks table object:", typeof mission_tasks !== 'undefined' ? "Loaded successfully" : "FAILED to load");

if (typeof department_hubs !== 'undefined') {
    console.log("department_hubs column keys:", Object.keys(department_hubs));
}
if (typeof command_profiles !== 'undefined') {
    console.log("command_profiles column keys:", Object.keys(command_profiles));
}
if (typeof mission_tasks !== 'undefined') {
    console.log("mission_tasks column keys:", Object.keys(mission_tasks));
}
