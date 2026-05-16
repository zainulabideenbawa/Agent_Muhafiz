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

export const updateIncidentState = async (incidentId, status, data) => {
    if (!db) return;
    const lastAgent = data.traceLogs?.[data.traceLogs.length - 1]?.agent || 'SYSTEM';
    const result = await db.update(incidents)
        .set({ status, data, last_agent: lastAgent })
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
