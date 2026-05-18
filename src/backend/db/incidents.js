import { eq, asc } from 'drizzle-orm';
import { db } from './connection.js';
import { incidents } from './schema.js';

export const saveIncident = async (incidentId, type, location, rawInput) => {
    if (!db) return;
    const result = await db.insert(incidents).values({
        incident_id: incidentId,
        type: type || 'UNKNOWN',
        location: location || 'ANALYZING',
        status: 'PENDING',
        description: rawInput,
        data: { raw_input: rawInput },
    }).returning();
    return result;
};

export const getIncidentById = async (incidentId) => {
    if (!db) return null;
    const result = await db.select().from(incidents)
        .where(eq(incidents.incident_id, incidentId));
    return result.length > 0 ? result[0] : null;
};

export const updateIncidentState = async (incidentId, status, data) => {
    if (!db) return;
    const existing = await db.select().from(incidents)
        .where(eq(incidents.incident_id, incidentId));
    
    let mergedData = data;
    if (existing.length > 0) {
        const currentData = existing[0].data || {};
        // If data contains traceLogs, merge or append them
        let mergedLogs = currentData.traceLogs || [];
        if (data.traceLogs) {
            // Avoid duplicate logs if any
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
};

export const getPendingIncidents = async () => {
    if (!db) return [];
    return await db.select().from(incidents)
        .where(eq(incidents.status, 'PENDING'))
        .orderBy(asc(incidents.created_at));
};

export const getAllIncidents = async (limit = 20) => {
    if (!db) return [];
    return await db.select().from(incidents)
        .orderBy(asc(incidents.created_at))
        .limit(limit);
};
