import { eq, desc } from 'drizzle-orm';
import { db } from './connection.js';
import { mission_tasks } from './schema.js';

let localTasks = [
    { task_id: 'TSK-101', incident_ref: 'INC-001', status: 'ON_SCENE', assigned_agent: 'The Dispatcher', mission_objective: 'Contain secondary fire at Saddar Bazaar', priority_level: 2 },
    { task_id: 'TSK-102', incident_ref: 'INC-002', status: 'ANALYSIS', assigned_agent: 'The Analyst', mission_objective: 'Assess flood risk for NIPA bridge', priority_level: 1 }
];

export const getAllTasks = async () => {
    if (db) {
        try {
            const results = await db.select().from(mission_tasks).orderBy(desc(mission_tasks.id));
            if (results.length > 0) return results;
        } catch (e) { console.error("DB getAllTasks Failed, using local cache:", e); }
    }
    return localTasks;
};

export const updateTaskStatus = async (taskId, status, summary) => {
    if (db) {
        try {
            await db.update(mission_tasks)
                .set({
                    status,
                    resolution_summary: summary,
                    completed_at: status === 'RESOLVED' ? new Date() : null,
                })
                .where(eq(mission_tasks.task_id, taskId));
        } catch (e) { console.error("DB updateTaskStatus Failed:", e); }
    }
    localTasks = localTasks.map(t => t.task_id === taskId ? {
        ...t,
        status,
        resolution_summary: summary,
        completed_at: status === 'RESOLVED' ? new Date().toISOString() : null
    } : t);
};

export const insertTask = async ({ task_id, incident_ref, status, assigned_agent, mission_objective, priority_level }) => {
    if (db) {
        try {
            await db.insert(mission_tasks).values({ task_id, incident_ref, status, assigned_agent, mission_objective, priority_level });
        } catch (e) { console.error("DB insertTask Failed:", e); }
    }
    localTasks.unshift({
        task_id,
        incident_ref,
        status: status || 'INGESTED',
        assigned_agent: assigned_agent || 'The Dispatcher',
        mission_objective: mission_objective || 'Urban Emergency Response',
        priority_level: priority_level || 1,
        created_at: new Date().toISOString()
    });
};

export const insertMaintenanceTask = async (sector) => {
    const task_id = 'MNT-' + Date.now().toString().slice(-4);
    if (db) {
        try {
            await db.insert(mission_tasks).values({
                task_id,
                incident_ref: 'PREVENTATIVE',
                status: 'ASSIGNED',
                assigned_agent: 'KMC_ENG',
                mission_objective: `Sewerage Clearance: ${sector}`,
                priority_level: 3,
            });
        } catch (e) { console.error("DB insertMaintenanceTask Failed:", e); }
    }
    localTasks.unshift({
        task_id,
        incident_ref: 'PREVENTATIVE',
        status: 'ASSIGNED',
        assigned_agent: 'KMC_ENG',
        mission_objective: `Sewerage Clearance: ${sector}`,
        priority_level: 3,
        created_at: new Date().toISOString()
    });
};
