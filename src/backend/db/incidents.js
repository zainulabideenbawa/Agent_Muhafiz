import { eq, asc } from 'drizzle-orm';
import { db } from './connection.js';
import { incidents } from './schema.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_FILE = path.join(__dirname, 'local_store.json');

const loadLocalIncidents = () => {
    try {
        if (fs.existsSync(STORE_FILE)) {
            const fileData = fs.readFileSync(STORE_FILE, 'utf8');
            return JSON.parse(fileData);
        }
    } catch (e) {
        console.error("[Local Store] Failed to load local_store.json:", e);
    }
    return [
        {
            incident_id: 'MHFZ-9021',
            type: 'URBAN_FLOOD',
            location: 'NIPA Chowrangi',
            status: 'ANALYZING',
            description: 'NIPA doob gaya!',
            data: { raw_input: 'NIPA doob gaya!' },
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
    ];
};

const persistLocalIncidents = () => {
    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(localIncidents, null, 2), 'utf8');
    } catch (e) {
        console.error("[Local Store] Failed to write local_store.json:", e);
    }
};

let localIncidents = loadLocalIncidents();

export const saveIncident = async (incidentId, type, location, rawInput) => {
    const newIncident = {
        incident_id: incidentId,
        type: type || 'UNKNOWN',
        location: location || 'ANALYZING',
        status: 'PENDING',
        description: rawInput,
        data: { raw_input: rawInput },
        created_at: new Date().toISOString()
    };
    if (db) {
        try {
            const result = await db.insert(incidents).values({
                incident_id: incidentId,
                type: type || 'UNKNOWN',
                location: location || 'ANALYZING',
                status: 'PENDING',
                description: rawInput,
                data: { raw_input: rawInput },
            }).returning();
            localIncidents.unshift(newIncident);
            persistLocalIncidents();
            return result;
        } catch (e) {
            console.error("DB saveIncident Failed, using local cache:", e);
        }
    }
    localIncidents.unshift(newIncident);
    persistLocalIncidents();
    return [newIncident];
};

export const getIncidentById = async (incidentId) => {
    if (db) {
        try {
            const result = await db.select().from(incidents)
                .where(eq(incidents.incident_id, incidentId));
            if (result.length > 0) return result[0];
        } catch (e) { console.error("DB getIncidentById Failed:", e); }
    }
    return localIncidents.find(inc => inc.incident_id === incidentId) || null;
};

export const updateIncidentState = async (incidentId, status, data) => {
    let mergedData = data;
    const existingIndex = localIncidents.findIndex(inc => inc.incident_id === incidentId);
    let existingIncident = existingIndex !== -1 ? localIncidents[existingIndex] : null;

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

    if (db) {
        try {
            const updateFields = { status, data: mergedData, last_agent: lastAgent };
            if (mergedData.classification?.location?.landmark) {
                updateFields.location = mergedData.classification.location.landmark;
            }
            if (mergedData.classification?.type && mergedData.classification.type !== 'UNKNOWN') {
                updateFields.type = mergedData.classification.type.toUpperCase();
            }

            const result = await db.update(incidents)
                .set(updateFields)
                .where(eq(incidents.incident_id, incidentId))
                .returning();
            
            if (existingIndex !== -1) {
                localIncidents[existingIndex] = {
                    ...localIncidents[existingIndex],
                    status,
                    data: mergedData,
                    last_agent: lastAgent,
                    location: updateFields.location || localIncidents[existingIndex].location,
                    type: updateFields.type || localIncidents[existingIndex].type
                };
                persistLocalIncidents();
            }
            return result;
        } catch (e) { console.error("DB updateIncidentState Failed:", e); }
    }

    if (existingIndex !== -1) {
        const landmark = mergedData.classification?.location?.landmark;
        const typeVal = mergedData.classification?.type;
        localIncidents[existingIndex] = {
            ...localIncidents[existingIndex],
            status,
            data: mergedData,
            last_agent: lastAgent,
            location: landmark || localIncidents[existingIndex].location,
            type: typeVal ? typeVal.toUpperCase() : localIncidents[existingIndex].type
        };
        persistLocalIncidents();
        return [localIncidents[existingIndex]];
    }
};

export const getPendingIncidents = async () => {
    if (db) {
        try {
            return await db.select().from(incidents)
                .where(eq(incidents.status, 'PENDING'))
                .orderBy(asc(incidents.created_at));
        } catch (e) { console.error("DB getPendingIncidents Failed:", e); }
    }
    return localIncidents.filter(inc => inc.status === 'PENDING');
};

export const getAllIncidents = async (limit = 20) => {
    if (db) {
        try {
            const results = await db.select().from(incidents)
                .orderBy(asc(incidents.created_at))
                .limit(limit);
            if (results.length > 0) return results;
        } catch (e) { console.error("DB getAllIncidents Failed:", e); }
    }
    return localIncidents.slice(0, limit);
};
