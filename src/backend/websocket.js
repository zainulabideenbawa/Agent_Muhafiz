import { WebSocketServer } from 'ws';

const clients = new Set();

export const initWebSocket = (server) => {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('[WebSocket] Client connected');
        clients.add(ws);

        ws.on('close', () => {
            console.log('[WebSocket] Client disconnected');
            clients.delete(ws);
        });
    });
};

export const broadcast = (message) => {
    const data = JSON.stringify(message);
    clients.forEach((client) => {
        if (client.readyState === 1) {
            client.send(data);
        }
    });
};
