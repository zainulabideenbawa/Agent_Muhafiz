import express from 'express';
import http from 'http';
import cors from 'cors';
import { initDb } from './db/index.js';
import { initWebSocket } from './websocket.js';
import router from './routes/index.js';
import { startIncidentWorker } from './incident_worker.js';
import { startSocialUplink } from './social_uplink.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(router);

const server = http.createServer(app);
initWebSocket(server);

const PORT = process.env.PORT || 3009;
server.listen(PORT, async () => {
    await initDb();
    startIncidentWorker();
    if (process.env.APIFY_TOKEN) {
        startSocialUplink();
    } else {
        console.log('[OSINT] APIFY_TOKEN not set — social uplink disabled.');
    }
    console.log(`=========================================`);
    console.log(`Muhafiz-X Backend Server Running!`);
    console.log(`HTTP Port: http://localhost:${PORT}`);
    console.log(`WebSocket: ws://localhost:${PORT}`);
    console.log(`=========================================`);
});
