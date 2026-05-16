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

import { initDb, getDeptResources, updateDeptResources, saveIncident, updateIncidentState } from './db.js';

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

// Mobile App Endpoints
app.get('/api/incidents', async (req, res) => {
    try {
        const incidents = await sql`SELECT * FROM incidents ORDER BY created_at DESC LIMIT 20`;
        res.json(incidents);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/retract-alert', async (req, res) => {
    const { incidentId, reason } = req.body;
    console.log(`[Auditor Agent] ALERT RETRACTION: ${incidentId} due to ${reason}`);
    
    try {
        await updateIncidentState(incidentId, 'RETRACTED', { retraction_reason: reason });
        broadcast({
            type: 'TRACE_LOG',
            incidentId,
            log: {
                agent: 'The Auditor',
                message: `ALERT RETRACTED: Human-in-the-loop verification confirms ${reason}.`,
                outcome: 'Success'
            }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = 3001;
server.listen(PORT, async () => {
    await initDb();
    console.log(`=========================================`);
    console.log(`Muhafiz-X Backend Server Running!`);
    console.log(`HTTP Port: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`=========================================`);
});
