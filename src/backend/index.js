import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { muhafizGraph } from './graph.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// WebSocket Connection & Agent Cascade Trigger
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Event 1: Start Agent Cascade from Admin Dashboard
    socket.on('trigger-cascade', async (payload) => {
        await runMuhafizCascade(socket, payload);
    });

    // Event 2: New Report from Citizen App
    socket.on('citizen-report', async (payload) => {
        console.log('New Citizen Report received:', payload.signal);
        // Add specific metadata for citizen reports
        const enrichedPayload = {
            ...payload,
            source: 'CitizenApp',
            timestamp: new Date().toISOString()
        };
        await runMuhafizCascade(socket, enrichedPayload);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// --- REST API Endpoints for Agent Tools ---

// 1. Tool: get_city_vitals
app.post('/tools/vitals', (req, res) => {
    const { location } = req.body;
    const mockVitals = {
        "NIPA": { traffic_speed: 5, rainfall: 45, water_level: 12 },
        "Sharea Faisal": { traffic_speed: 12, rainfall: 30, water_level: 5 },
        "G-10": { traffic_speed: 2, rainfall: 55, water_level: 20 }
    };
    
    const data = mockVitals[location] || { traffic_speed: 40, rainfall: 5, water_level: 0 };
    console.log(`[API] Vitals requested for ${location}`);
    res.json({ status: "success", ...data });
});

// 2. Tool: get_resource_status
app.get('/tools/resources', (req, res) => {
    console.log(`[API] Resource status requested`);
    res.json({
        ambulances: 5,
        suction_trucks: 3,
        fire_tenders: 2,
        police_units: 8,
        status: "online"
    });
});

// 3. Tool: run_impact_simulation
app.post('/tools/simulate', (req, res) => {
    const { action_plan } = req.body;
    const timeSaved = Math.floor(Math.random() * 25) + 10;
    const congestionDelta = -20 - Math.floor(Math.random() * 30);
    
    console.log(`[API] Simulation triggered for plan`);
    res.json({
        approved: true,
        time_saved_minutes: timeSaved,
        congestion_reduction_percent: congestionDelta,
        lives_at_risk_mitigated: 4
    });
});

// 4. Internal Trace: Antigravity calls this when an agent finishes a "thought"
app.post('/internal/trace', (req, res) => {
    const { agent, message, status } = req.body;
    console.log(`[Internal Trace] ${agent}: ${message}`);
    
    // Broadcast to the dashboard via WebSockets
    io.emit('agent_trace', {
        timestamp: new Date().toLocaleTimeString(),
        agent: agent,
        message: message,
        status: status || "success"
    });
    
    res.sendStatus(200);
});


/**
 * Orchestrates the Muhafiz-X Graph execution and streams results via Socket.io
 */
async function runMuhafizCascade(socket, payload) {
    console.log('Running Muhafiz-X Cascade...');
    try {
        const initialState = {
            incident_id: `MHFZ-${Math.floor(Math.random() * 10000)}`,
            signal: { 
                raw_input: payload.signal || payload.raw_input || "No signal provided", 
                sentiment: payload.sentiment || "urgent", 
                language: payload.language || "roman-urdu" 
            },
            classification: {
                location: { landmark: payload.location || "Unknown" }
            },
            traceLogs: [{
                timestamp: new Date().toISOString(),
                agent: "System",
                message: `Cascade initialized via ${payload.source || 'Dashboard'}.`,
                outcome: "Started"
            }]
        };

        const stream = await muhafizGraph.stream(initialState);
        
        for await (const chunk of stream) {
            const nodeName = Object.keys(chunk)[0];
            const update = chunk[nodeName];

            // 1. Stream Trace Logs for Terminal UI
            if (update.traceLogs) {
                update.traceLogs.forEach(log => {
                    const traceData = {
                        timestamp: new Date().toLocaleTimeString(),
                        agent: log.agent,
                        message: log.message,
                        status: log.outcome === "Error" ? "error" : "success"
                    };
                    // Emit both for compatibility
                    socket.emit('agent-log', log); 
                    socket.emit('agent_trace', traceData);
                    io.emit('agent_trace', traceData); // Broadcast globally as well
                });
            }


            // 2. Stream Action Plans / Alerts for the Apps
            if (update.action_plan || update.communication || update.simulation) {
                socket.emit('app-update', {
                    node: nodeName,
                    data: update
                });
            }
        }

        socket.emit('cascade-complete', { status: 'success' });
        
    } catch (error) {
        console.error('Cascade error:', error);
        socket.emit('agent-log', {
            timestamp: new Date().toISOString(),
            agent: "System",
            message: `Error in cascade: ${error.message}`,
            outcome: "Error"
        });
    }
}


const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Muhafiz Backend running on port ${PORT}`);
    console.log(`WebSocket server ready for agent traces`);
});