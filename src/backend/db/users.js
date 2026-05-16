import { eq } from 'drizzle-orm';
import { db } from './connection.js';
import { users, command_profiles } from './schema.js';

export const createUser = async (user) => {
    if (!db) return;
    const result = await db.insert(users).values({
        nic_number: user.nic,
        name: user.name,
        sector: user.sector,
        password: user.password,
    }).returning({ id: users.id, nic_number: users.nic_number, name: users.name, sector: users.sector });
    return result;
};

export const findUserByNic = async (nic) => {
    if (!db) return null;
    const result = await db.select().from(users).where(eq(users.nic_number, nic));
    return result[0] ?? null;
};

export const findCommanderById = async (commanderId) => {
    if (!db) return null;
    const result = await db.select().from(command_profiles).where(eq(command_profiles.commander_id, commanderId));
    return result[0] ?? null;
};

export const findCommanderByEmail = async (email) => {
    if (!db) return null;
    const result = await db.select().from(command_profiles).where(eq(command_profiles.email, email));
    return result[0] ?? null;
};
