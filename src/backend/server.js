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

import { getDeptResources, updateDeptResources } from './db.js';

app.get('/tools/resources', (req, res) => {
    // Legacy support for general tool call
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
    const isApproved = Math.random() > 0.2; // 80% success rate for simulation
    
    res.json({
        approved: isApproved,
        time_saved_minutes: isApproved ? 45 : 0,
        congestion_reduction_percent: isApproved ? 30 : 0
    });
});

// Start a simulated crisis
app.post('/api/trigger-crisis', async (req, res) => {
    console.log('[API] Triggering Crisis Simulation...');
    
    try {
        const { input } = req.body;
        const incidentId = `MHFZ-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const initialState = {
            signal: { raw_input: input || "NIPA doob gaya" },
            metadata: { incidentId }, // Track this throughout the graph
            traceLogs: []
        };
        
        const stream = await muhafizGraph.stream(initialState);
        
        let assignedDept = null;
        for await (const chunk of stream) {
            const nodeName = Object.keys(chunk)[0];
            const stateUpdate = chunk[nodeName];
            
            if (stateUpdate.assigned_department) assignedDept = stateUpdate.assigned_department;
            
            console.log(`[Graph] Node finished: ${nodeName}`);
            
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
            
            // Artificial delay for UI dramatic effect
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('[Error] Graph Execution Failed:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Muhafiz-X Backend Server Running!`);
    console.log(`HTTP Port: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`=========================================`);
});
