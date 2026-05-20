import { broadcast } from './websocket.js';

export const apiHealth = {
    tomtom: { status: 'ONLINE', latency: 0 },
    openstreetmap: { status: 'ONLINE', latency: 0 },
    openmeteo: { status: 'ONLINE', latency: 0 },
    nasa_firms: { status: 'ONLINE', latency: 0 },
    llm_gateway: { status: 'ONLINE', latency: 0 },
    overall: 'ONLINE'
};

export const updateApiHealth = (apiName, isOnline, latency = 0) => {
    if (!apiHealth[apiName]) return;

    const previousStatus = apiHealth[apiName].status;
    const newStatus = isOnline ? 'ONLINE' : 'DEGRADED';
    
    apiHealth[apiName].status = newStatus;
    apiHealth[apiName].latency = Math.round(latency);

    // Calculate overall health
    const statuses = Object.entries(apiHealth)
        .filter(([key]) => key !== 'overall')
        .map(([_, val]) => val.status);

    const hasDegraded = statuses.includes('DEGRADED');
    const newOverall = hasDegraded ? 'DEGRADED' : 'ONLINE';
    apiHealth.overall = newOverall;

    // Send update over WebSocket if something changed or just to sync
    broadcast({
        type: 'HEALTH_UPDATE',
        health: apiHealth
    });
};
