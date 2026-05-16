import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import cors from 'cors';
import { muhafizGraph } from './graph.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Track connected clients
const clients = new Set();

wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    clients.add(ws);
    
    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        clients.delete(ws);
    });
});

// Broadcast helper
const broadcast = (message) => {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            client.send(data);
        }
    });
};

// Tool Endpoints: Logic for the 7-Agent Council
app.post('/tools/vitals', (req, res) => {
    const { location } = req.body;
    console.log(`[Tool] Vitals request for: ${location}`);
    
    // Simulate real-time sensors
    res.json({
        location: location,
        traffic_speed: 12 + Math.floor(Math.random() * 20), // km/h
        rainfall: 25 + Math.floor(Math.random() * 30),     // mm
        water_level: 15 + Math.floor(Math.random() * 50)   // cm
    });
});

import { sql, getDepartmentResources, updateDepartmentResources, saveIncident, updateIncidentState, getCitySensors, getCityVitals, getPerformanceStats } from './db.js';

app.get('/api/performance/:deptId', (req, res) => {
    res.json(getPerformanceStats(req.params.deptId));
});

app.get('/api/sensors', (req, res) => {
    res.json(getCitySensors());
});

app.get('/api/city-vitals', (req, res) => {
    res.json(getCityVitals());
});

app.get('/tools/resources', (req, res) => {
    res.json(getDeptResources('KMC_HEALTH'));
});

app.get('/api/department-resources/:deptId', (req, res) => {
    res.json(getDeptResources(req.params.deptId));
});

app.post('/api/department-resources/:deptId', (req, res) => {
    const updated = updateDeptResources(req.params.deptId, req.body);
    res.json(updated);
});

let activeUserDirective = null;

app.post('/api/agent-directive', (req, res) => {
    const { directive } = req.body;
    activeUserDirective = directive;
    console.log(`[Sovereign] Manual Directive Received: ${directive}`);
    res.json({ success: true, directive });
});

// 4. Mission Tasking System
app.get('/api/tasks', async (req, res) => {
    if (sql) {
        const tasks = await sql`SELECT * FROM mission_tasks ORDER BY id DESC`;
        return res.json(tasks);
    }
    res.json([]);
});

app.post('/api/tasks/:taskId/status', async (req, res) => {
    const { taskId } = req.params;
    const { status, summary } = req.body;
    if (sql) {
        await sql`
            UPDATE mission_tasks 
            SET status = ${status}, resolution_summary = ${summary}, completed_at = ${status === 'RESOLVED' ? new Date() : null}
            WHERE task_id = ${taskId}
        `;
    }
    res.json({ success: true });
});

// 7. Professional Auth Gateway
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    // In a production app, we would hash/check passwords here
    // For this Sovereign OS, we'll use role-based routing from the DB
    if (sql) {
        const users = await sql`SELECT * FROM command_profiles WHERE email = ${email}`;
        if (users.length > 0) {
            return res.json({ success: true, user: users[0] });
        }
    }
    
    // Default Fallback for Demo
    if (email === 'admin@muhafiz.gov' && password === 'sovereign') {
        return res.json({ success: true, user: { role: 'SUPER_ADMIN', name: 'Sovereign Architect', email } });
    }
    res.status(401).json({ success: false, message: 'Invalid Credentials' });
});

// 8. Sovereign Execution (Hard Logic)
app.post('/api/execute/deploy-hub', async (req, res) => {
    const { sector, dept } = req.body;
    if (sql) {
        await sql`
            INSERT INTO department_hubs (dept_id, name, location, trucks, ambulances, officers)
            VALUES (${dept}, ${sector + ' Station'}, ${sector}, 5, 2, 10)
        `;
    }
    res.json({ success: true, message: `Station Authorized in ${sector}` });
});

app.post('/api/execute/dispatch-maintenance', async (req, res) => {
    const { sector, logic } = req.body;
    if (sql) {
        await sql`
            INSERT INTO mission_tasks (task_id, incident_ref, status, assigned_agent, mission_objective, priority_level)
            VALUES (${'MNT-' + Date.now().toString().slice(-4)}, 'PREVENTATIVE', 'ASSIGNED', 'KMC_ENG', ${'Sewerage Clearance: ' + sector}, 3)
        `;
    }
    res.json({ success: true, message: 'Maintenance Crew Dispatched' });
});

import { getUrbanOptimization } from './db.js';

// 6. Sovereign Architect (Super Admin Intelligence)
app.get('/api/sovereign-intelligence', (req, res) => {
    res.json(getUrbanOptimization());
});

// 5. User Management (Command Profiles)
app.get('/api/commander-profile/:id', async (req, res) => {
    const { id } = req.params;
    if (sql) {
        const profiles = await sql`SELECT * FROM command_profiles WHERE commander_id = ${id}`;
        return res.json(profiles[0] || { name: 'Unknown', rank: 'Guest' });
    }
    res.json({ name: 'Simulated Commander', rank: 'Sovereign-1' });
});

app.post('/tools/simulate', (req, res) => {
    const { action_plan } = req.body;
    const isApproved = Math.random() > 0.2;
    res.json({ approved: isApproved, time_saved_minutes: isApproved ? 45 : 0 });
});
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
            
            // Sync current state for persistence
            finalState = { ...finalState, ...stateUpdate };

            if (stateUpdate && stateUpdate.traceLogs && stateUpdate.traceLogs.length > 0) {
                const latestLog = stateUpdate.traceLogs[stateUpdate.traceLogs.length - 1];
                broadcast({
                    type: 'TRACE_LOG',
                    incidentId,
                    assigned_department: assignedDept,
                    log: latestLog
                });
            }

            if (nodeName === 'TheCommunicator' && stateUpdate.communication) {
                broadcast({
                    type: 'COMMUNICATION_ALERT',
                    incidentId,
                    assigned_department: assignedDept,
                    data: stateUpdate.communication
                });
            }
            
            // Persist step-by-step state to Neon
            await updateIncidentState(incidentId, 'PROCESSING', finalState);
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // Save final state to persistence
        await updateIncidentState(incidentId, 'RESOLVED', finalState);

        // AUTO-TASKING BRIDGE: Create a formal mission task from the AI analysis
        if (sql && finalState.deployment) {
            await sql`
                INSERT INTO mission_tasks (task_id, incident_ref, status, assigned_agent, mission_objective, priority_level)
                VALUES (
                    ${'TSK-' + Math.random().toString(36).substr(2, 4).toUpperCase()},
                    ${incidentId},
                    'ON_SCENE',
                    'The Dispatcher',
                    ${finalState.deployment.logic || 'Urban Emergency Response'},
                    ${finalState.deployment.threat_level || 5}
                )
            `;
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

// Start a simulated crisis
app.post('/api/trigger-crisis', async (req, res) => {
    const { input } = req.body;
    const incidentId = `MHFZ-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // 1. Persist to Database First (The Ingest)
    await saveIncident(incidentId, 'UNKNOWN', 'ANALYZING', input);
    
    // 2. Trigger Logic (Autonomous)
    runSovereignLogic(incidentId, input);
    
    res.json({ success: true, incidentId });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Muhafiz-X Backend Server Running!`);
    console.log(`HTTP Port: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`=========================================`);
});
