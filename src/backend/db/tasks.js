import { eq, desc } from 'drizzle-orm';
import { db } from './connection.js';
import { mission_tasks } from './schema.js';

export const getAllTasks = async () => {
    if (!db) return [];
    return await db.select().from(mission_tasks).orderBy(desc(mission_tasks.id));
};

export const updateTaskStatus = async (taskId, status, summary) => {
    if (!db) return;
    await db.update(mission_tasks)
        .set({
            status,
            resolution_summary: summary,
            completed_at: status === 'RESOLVED' ? new Date() : null,
        })
        .where(eq(mission_tasks.task_id, taskId));
};

export const insertTask = async ({ task_id, incident_ref, status, assigned_agent, mission_objective, priority_level }) => {
    if (!db) return;
    await db.insert(mission_tasks).values({ task_id, incident_ref, status, assigned_agent, mission_objective, priority_level });
};

export const insertMaintenanceTask = async (sector) => {
    if (!db) return;
    await db.insert(mission_tasks).values({
        task_id: 'MNT-' + Date.now().toString().slice(-4),
        incident_ref: 'PREVENTATIVE',
        status: 'ASSIGNED',
        assigned_agent: 'KMC_ENG',
        mission_objective: `Sewerage Clearance: ${sector}`,
        priority_level: 3,
    });
};
