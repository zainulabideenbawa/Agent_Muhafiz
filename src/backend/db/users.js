import { eq } from 'drizzle-orm';
import { db } from './connection.js';
import { users, command_profiles } from './schema.js';

let localCommanders = [
    { commander_id: 'CMD-001', email: 'kmc@muhafiz.gov', name: 'Eng. Zafar', rank: 'Infrastructure Chief', department: 'KMC_HEALTH', permissions: ['DEPLOY_RESOURCES', 'VIEW_MAP'] },
    { commander_id: 'CMD-002', email: 'police@muhafiz.gov', name: 'Cmdr. Ahmed', rank: 'Sindh Police Marshal', department: 'POLICE_FORCE', permissions: ['DEPLOY_RESOURCES', 'VIEW_MAP'] },
    { commander_id: 'CMD-003', email: 'fire@muhafiz.gov', name: 'Capt. Raza', rank: 'Fire Chief', department: 'FIRE_BRIGADE', permissions: ['DEPLOY_RESOURCES', 'VIEW_MAP'] },
    { commander_id: 'CMD-004', email: 'rescue@muhafiz.gov', name: 'Para. Sara', rank: 'Rescue Director', department: 'RESCUE_1122', permissions: ['DEPLOY_RESOURCES', 'VIEW_MAP'] }
];

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
    return {
        nic_number: nic,
        name: `Citizen-${nic.slice(-4)}`,
        sector: 'GENERAL',
        password: 'OIDC_VERIFIED'
    };
};

export const findCommanderById = async (commanderId) => {
    if (db) {
        try {
            const result = await db.select().from(command_profiles).where(eq(command_profiles.commander_id, commanderId));
            if (result.length > 0) return { ...result[0], role: 'DEPT_ADMIN' };
        } catch (e) { console.error("DB findCommanderById Failed:", e); }
    }
    const matched = localCommanders.find(c => c.commander_id === commanderId);
    if (matched) {
        return {
            ...matched,
            role: 'DEPT_ADMIN'
        };
    }
    return null;
};

export const findCommanderByEmail = async (email) => {
    if (db) {
        try {
            const result = await db.select().from(command_profiles).where(eq(command_profiles.email, email));
            if (result.length > 0) return { ...result[0], role: 'DEPT_ADMIN' };
        } catch (e) { console.error("DB findCommanderByEmail Failed:", e); }
    }
    const matched = localCommanders.find(c => c.email === email);
    if (matched) {
        return {
            ...matched,
            role: 'DEPT_ADMIN'
        };
    }
    return null;
};
