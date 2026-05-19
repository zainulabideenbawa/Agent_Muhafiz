import { eq, asc } from 'drizzle-orm';
import { db } from './connection.js';
import { incidents } from './schema.js';

export const saveIncident = async (incidentId, type, location, rawInput) => {
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
    try {
        // We need to fetch existing incident to merge data properly
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
    try {
        return await db.select().from(incidents)
            .where(eq(incidents.status, 'PENDING'))
            .orderBy(asc(incidents.created_at));
    } catch (e) { 
        console.error("DB getPendingIncidents Failed:", e);
        throw e;
    }
};

export const getAllIncidents = async (limit = 20) => {
    try {
        const results = await db.select().from(incidents)
            .orderBy(asc(incidents.created_at))
            .limit(limit);
        return results;
    } catch (e) { 
        console.error("DB getAllIncidents Failed:", e);
        throw e;
    }
};
