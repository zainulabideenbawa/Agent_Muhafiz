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

// Start a simulated crisis
app.post('/api/trigger-crisis', async (req, res) => {
    console.log('[API] Triggering Crisis Simulation...');
    
    // Initial state to kick off The Sentinel
    const initialState = {
        signal: { raw_input: req.body.input || "NIPA doob gaya" }
    };
    
    try {
        // Since we simulate agents sequentially, we will use the stream method 
        // from LangGraph to get updates after each node finishes.
        const stream = await muhafizGraph.stream(initialState);
        
        let finalState = null;

        // Iterate over the stream of node executions
        for await (const chunk of stream) {
            // chunk is an object like { "TheSentinel": { ...stateUpdate } }
            const nodeName = Object.keys(chunk)[0];
            const stateUpdate = chunk[nodeName];
            
            console.log(`[Graph] Node finished: ${nodeName}`);
            
            // Broadcast the latest trace logs to the frontend
            if (stateUpdate && stateUpdate.traceLogs && stateUpdate.traceLogs.length > 0) {
                // Send just the latest log
                broadcast({
                    type: 'TRACE_LOG',
                    log: stateUpdate.traceLogs[stateUpdate.traceLogs.length - 1]
                });
            }
            
            finalState = stateUpdate;
            
            // Add a small artificial delay so the UI animation feels like "thinking"
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        res.json({ success: true, finalState });
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
