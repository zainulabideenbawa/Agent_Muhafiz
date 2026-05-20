import { eq } from 'drizzle-orm';
import { db } from './connection.js';
import { users, command_profiles } from './schema.js';

export const createUser = async (user) => {
    if (!db) return [user];
    try {
        const result = await db.insert(users).values({
            nic_number: user.nic,
            name: user.name,
            sector: user.sector,
            password: user.password,
        }).returning({ id: users.id, nic_number: users.nic_number, name: users.name, sector: users.sector });
        return result;
    } catch (e) {
        console.error("DB createUser Failed, falling back", e);
        return [user];
    }
};

export const findUserByNic = async (nic) => {
    if (db) {
        try {
            const result = await db.select().from(users).where(eq(users.nic_number, nic));
            if (result.length > 0) return result[0];
        } catch (e) { console.error("DB findUserByNic Failed:", e); }
    }
    return null;
};

export const findCommanderById = async (commanderId) => {
    if (db) {
        try {
            const result = await db.select().from(command_profiles).where(eq(command_profiles.commander_id, commanderId));
            if (result.length > 0) return { ...result[0], role: result[0].department === 'SOVEREIGN' ? 'SUPER_ADMIN' : 'DEPT_ADMIN' };
        } catch (e) { console.error("DB findCommanderById Failed:", e); }
    }
    return null;
};

export const findCommanderByEmail = async (email) => {
    if (db) {
        try {
            const result = await db.select().from(command_profiles).where(eq(command_profiles.email, email));
            if (result.length > 0) {
                const row = result[0];
                return { ...row, role: row.department === 'SOVEREIGN' ? 'SUPER_ADMIN' : 'DEPT_ADMIN' };
            }
        } catch (e) { console.error("DB findCommanderByEmail Failed:", e); }
    }
    return null;
};

export const createOfficer = async (officer) => {
    if (!db) throw new Error('No DB connection');
    const commanderId = `CMD-${Date.now()}`;
    const result = await db.insert(command_profiles).values({
        commander_id: commanderId,
        email: officer.email,
        cnic: officer.cnic || null,
        name: officer.name,
        rank: officer.rank,
        department: officer.department,
        password: officer.password,
        permissions: ['DEPLOY_RESOURCES', 'VIEW_MAP'],
    }).returning();
    return result[0];
};

export const getAllOfficers = async () => {
    if (!db) return [];
    try {
        const result = await db.select({
            id: command_profiles.id,
            commander_id: command_profiles.commander_id,
            email: command_profiles.email,
            cnic: command_profiles.cnic,
            name: command_profiles.name,
            rank: command_profiles.rank,
            department: command_profiles.department,
            permissions: command_profiles.permissions,
            last_login: command_profiles.last_login,
        }).from(command_profiles);
        return result;
    } catch (e) {
        console.error("DB getAllOfficers Failed:", e);
        return [];
    }
};

export const getAllCitizens = async () => {
    if (!db) return [];
    try {
        const result = await db.select({
            id: users.id,
            nic_number: users.nic_number,
            name: users.name,
            sector: users.sector,
            created_at: users.created_at,
        }).from(users);
        return result;
    } catch (e) {
        console.error("DB getAllCitizens Failed:", e);
        return [];
    }
};

