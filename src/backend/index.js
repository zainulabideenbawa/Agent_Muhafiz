import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { muhafizGraph } from './graph.js';
import { initDb, createUser, findUserByNic, sql } from './db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// Initialize Neon DB
initDb();

// --- AUTH ENDPOINTS ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const user = await createUser(req.body);
        res.json({ success: true, user: user[0] });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(400).json({ success: false, error: "Enrollment Failed (NIC might exist)" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { nic, password } = req.body;
    try {
        const user = await findUserByNic(nic);
        if (user && user.password === password) {
            res.json({ success: true, user });
        } else {
            res.status(401).json({ success: false, error: "Identity Verification Failed" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Database Connection Error" });
    }
});

// --- INCIDENT TRACKING ---
app.get('/api/incidents/:nic', async (req, res) => {
    try {
        const incidents = await sql`SELECT * FROM incidents ORDER BY created_at DESC LIMIT 20`;
        res.json({ success: true, incidents });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch audit trails" });
    }
});

// --- LIVE AREA PULSE ---
app.get('/api/area/pulse/:sector', (req, res) => {
    res.json({
        sector: req.params.sector,
        vitals: {
            water_timing: "08:00 AM - 10:00 AM",
            road_status: "Clear (Normal Traffic)",
            electricity: "Stable",
            security_level: "High (Active Patrol)"
        }
    });
});

// --- REPORT SUBMISSION (Triggers Agent Council) ---
app.post('/api/report', async (req, res) => {
    const { signal, metadata } = req.body;
    console.log(`[Council] New Signal Received: "${signal}"`);
    
    try {
        // Save to DB
        const incident = await sql`
            INSERT INTO incidents (description, status, last_agent) 
            VALUES (${signal}, 'ANALYZING', 'SENTINEL')
            RETURNING *
        `;

        // Trigger Async Agent Reasoning
        runAgentCascade(signal, incident[0].id);

        res.json({ success: true, incident: incident[0] });
    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ success: false, error: "Council ingestion failed" });
    }
});

// --- AGENT CASCADE LOGIC ---
async function runAgentCascade(signal, incidentId) {
    try {
        const config = { configurable: { thread_id: `inc_${incidentId}` } };
        const stream = await muhafizGraph.stream({
            messages: [{ role: "user", content: signal }]
        }, config);

        for await (const chunk of stream) {
            const agentName = Object.keys(chunk)[0];
            const content = chunk[agentName];
            
            let message = "";
            if (content.messages && content.messages.length > 0) {
                message = content.messages[content.messages.length - 1].content;
            }

            // Stream to Mobile via Socket.io
            io.emit('agent-log', {
                timestamp: new Date().toISOString(),
                agent: agentName,
                message: message,
                incidentId: incidentId
            });
            
            console.log(`[Agent: ${agentName}] thinking...`);
        }
    } catch (error) {
        console.error('Cascade error:', error);
    }
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Muhafiz-X Backend: REST + Socket.io Active`);
    console.log(`Listening on port ${PORT}`);
    console.log(`=========================================`);
});
