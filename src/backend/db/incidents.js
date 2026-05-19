import { eq, asc, desc } from 'drizzle-orm';
import { db } from './connection.js';
import { incidents } from './schema.js';

// In-Memory Database Fallback for off-grid / local development when Neon DB is empty
let memoryIncidents = [];

export const saveIncident = async (incidentId, type, location, rawInput) => {
    if (!db) {
        console.log(`[DB/Memory] saving incident ${incidentId} to memory queue.`);
        const newInc = {
            incident_id: incidentId,
            type: type || 'UNKNOWN',
            location: location || 'ANALYZING',
            status: 'PENDING',
            description: rawInput,
            data: { raw_input: rawInput },
            created_at: new Date()
        };
        memoryIncidents.push(newInc);
        return [newInc];
    }
    try {
        const result = await db.insert(incidents).values({
            incident_id: incidentId,
            type: type || 'UNKNOWN',
            location: location || 'ANALYZING',
            status: 'PENDING',
            description: rawInput,
            data: { raw_input: rawInput },
        }).returning();
        return result;
    } catch (e) {
        console.error("DB saveIncident Failed:", e);
        throw e;
    }
};

export const getIncidentById = async (incidentId) => {
    if (!db) {
        const found = memoryIncidents.find(inc => inc.incident_id === incidentId);
        return found || null;
    }
    try {
        const result = await db.select().from(incidents)
            .where(eq(incidents.incident_id, incidentId));
        if (result.length > 0) return result[0];
        return null;
    } catch (e) {
        console.error("DB getIncidentById Failed:", e);
        throw e;
    }
};

export const updateIncidentState = async (incidentId, status, data) => {
    if (!db) {
        const idx = memoryIncidents.findIndex(inc => inc.incident_id === incidentId);
        if (idx !== -1) {
            const existing = memoryIncidents[idx];
            const currentData = existing.data || {};
            let mergedLogs = currentData.traceLogs || [];
            if (data.traceLogs) {
                const existingMessages = new Set(mergedLogs.map(l => l.message));
                for (const log of data.traceLogs) {
                    if (!existingMessages.has(log.message)) {
                        mergedLogs.push(log);
                    }
                }
            }
            const mergedData = {
                ...currentData,
                ...data,
                traceLogs: mergedLogs
            };
            const lastAgent = mergedData.traceLogs?.[mergedData.traceLogs.length - 1]?.agent || 'SYSTEM';

            memoryIncidents[idx] = {
                ...existing,
                status,
                data: mergedData,
                last_agent: lastAgent
            };
            return [memoryIncidents[idx]];
        }
        return [];
    }
    try {
        const existingIncident = await getIncidentById(incidentId);
        let mergedData = data;

        if (existingIncident) {
            const currentData = existingIncident.data || {};
            let mergedLogs = currentData.traceLogs || [];
            if (data.traceLogs) {
                const existingMessages = new Set(mergedLogs.map(l => l.message));
                for (const log of data.traceLogs) {
                    if (!existingMessages.has(log.message)) {
                        mergedLogs.push(log);
                    }
                }
            }
            mergedData = {
                ...currentData,
                ...data,
                traceLogs: mergedLogs
            };
        }

        const lastAgent = mergedData.traceLogs?.[mergedData.traceLogs.length - 1]?.agent || 'SYSTEM';

        const result = await db.update(incidents)
            .set({ status, data: mergedData, last_agent: lastAgent })
            .where(eq(incidents.incident_id, incidentId))
            .returning();

        return result;
    } catch (e) {
        console.error("DB updateIncidentState Failed:", e);
        throw e;
    }
};

export const getPendingIncidents = async () => {
    if (!db) {
        return memoryIncidents
            .filter(inc => inc.status === 'PENDING')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }
    try {
        return await db.select().from(incidents)
            .where(eq(incidents.status, 'PENDING'))
            .orderBy(desc(incidents.created_at));
    } catch (e) {
        console.error("DB getPendingIncidents Failed:", e);
        throw e;
    }
};

export const getAllIncidents = async (limit = 20) => {
    if (!db) {
        return [...memoryIncidents]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, limit);
    }
    try {
        const results = await db.select().from(incidents)
            .orderBy(desc(incidents.created_at))
            .limit(limit);
        return results;
    } catch (e) {
        console.error("DB getAllIncidents Failed:", e);
        throw e;
    }
};
