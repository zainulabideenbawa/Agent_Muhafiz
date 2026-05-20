import { eq, asc, desc } from 'drizzle-orm';
import { db } from './connection.js';
import { incidents } from './schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storePath = path.join(__dirname, 'local_store.json');

// In-Memory Database Fallback for off-grid / local development when Neon DB is down or empty
let memoryIncidents = [];
try {
    if (fs.existsSync(storePath)) {
        const rawData = fs.readFileSync(storePath, 'utf8');
        memoryIncidents = JSON.parse(rawData);
        console.log(`[DB/LocalStore] Successfully loaded ${memoryIncidents.length} incidents from local persistence.`);
    }
} catch (e) {
    console.error("[DB/LocalStore] Failed to load local_store.json:", e);
    memoryIncidents = [];
}

const persistLocalStore = () => {
    try {
        fs.writeFileSync(storePath, JSON.stringify(memoryIncidents, null, 2), 'utf8');
    } catch (e) {
        console.error("[DB/LocalStore] Failed to persist local_store.json:", e);
    }
};

// Fallback logic helpers to keep code clean
const localSaveIncident = (incidentId, type, location, rawInput) => {
    console.log(`[DB/Memory] Saving incident ${incidentId} to memory queue.`);
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
    persistLocalStore();
    return [newInc];
};

const localGetIncidentById = (incidentId) => {
    const found = memoryIncidents.find(inc => inc.incident_id === incidentId);
    return found || null;
};

const localUpdateIncidentState = (incidentId, status, data) => {
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

        // Sync top-level type + location columns from agent classification
        const resolvedType = mergedData.classification?.type || existing.type;
        const resolvedLoc = mergedData.classification?.location?.landmark || existing.location;

        memoryIncidents[idx] = {
            ...existing,
            status,
            data: mergedData,
            last_agent: lastAgent,
            type: (resolvedType && resolvedType !== 'UNKNOWN' && resolvedType !== 'UNCLASSIFIED') ? resolvedType : existing.type,
            location: (resolvedLoc && resolvedLoc !== 'ANALYZING' && resolvedLoc !== 'Karachi') ? resolvedLoc : existing.location,
        };
        persistLocalStore();
        return [memoryIncidents[idx]];
    }
    return [];
};

const localGetPendingIncidents = () => {
    return memoryIncidents
        .filter(inc => inc.status === 'PENDING')
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
};

const localGetAllIncidents = (limit = 20) => {
    return [...memoryIncidents]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
};

export const saveIncident = async (incidentId, type, location, rawInput) => {
    if (!db) {
        return localSaveIncident(incidentId, type, location, rawInput);
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
        console.warn(`[DB/ConnectionDown] saveIncident failed, falling back to local storage: ${e.message}`);
        return localSaveIncident(incidentId, type, location, rawInput);
    }
};

export const getIncidentById = async (incidentId) => {
    if (!db) {
        return localGetIncidentById(incidentId);
    }
    try {
        const result = await db.select().from(incidents)
            .where(eq(incidents.incident_id, incidentId));
        if (result.length > 0) return result[0];
        return null;
    } catch (e) {
        console.warn(`[DB/ConnectionDown] getIncidentById failed, falling back to local storage: ${e.message}`);
        return localGetIncidentById(incidentId);
    }
};

export const updateIncidentState = async (incidentId, status, data) => {
    if (!db) {
        return localUpdateIncidentState(incidentId, status, data);
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

        // Sync top-level type + location columns from agent classification
        const resolvedType = mergedData.classification?.type;
        const resolvedLoc = mergedData.classification?.location?.landmark;
        const updatePayload = { status, data: mergedData, last_agent: lastAgent };
        if (resolvedType && resolvedType !== 'UNKNOWN' && resolvedType !== 'UNCLASSIFIED') updatePayload.type = resolvedType;
        if (resolvedLoc && resolvedLoc !== 'ANALYZING' && resolvedLoc !== 'Karachi') updatePayload.location = resolvedLoc;

        const result = await db.update(incidents)
            .set(updatePayload)
            .where(eq(incidents.incident_id, incidentId))
            .returning();

        return result;
    } catch (e) {
        console.warn(`[DB/ConnectionDown] updateIncidentState failed, falling back to local storage: ${e.message}`);
        return localUpdateIncidentState(incidentId, status, data);
    }
};

export const getPendingIncidents = async () => {
    if (!db) {
        return localGetPendingIncidents();
    }
    try {
        return await db.select().from(incidents)
            .where(eq(incidents.status, 'PENDING'))
            .orderBy(desc(incidents.created_at));
    } catch (e) {
        console.warn(`[DB/ConnectionDown] getPendingIncidents failed, falling back to local storage: ${e.message}`);
        return localGetPendingIncidents();
    }
};

export const getAllIncidents = async (limit = 20) => {
    if (!db) {
        return localGetAllIncidents(limit);
    }
    try {
        const results = await db.select().from(incidents)
            .orderBy(desc(incidents.created_at))
            .limit(limit);
        return results;
    } catch (e) {
        console.warn(`[DB/ConnectionDown] getAllIncidents failed, falling back to local storage: ${e.message}`);
        return localGetAllIncidents(limit);
    }
};
