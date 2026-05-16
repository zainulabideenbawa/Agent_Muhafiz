import { pgTable, serial, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const incidents = pgTable('incidents', {
    id: serial('id').primaryKey(),
    incident_id: text('incident_id').unique().notNull(),
    description: text('description'),
    type: text('type'),
    location: text('location'),
    status: text('status').default('PENDING'),
    last_agent: text('last_agent').default('SENTINEL'),
    data: jsonb('data'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    nic_number: text('nic_number').unique().notNull(),
    name: text('name'),
    sector: text('sector'),
    password: text('password'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const department_hubs = pgTable('department_hubs', {
    id: serial('id').primaryKey(),
    dept_id: text('dept_id').notNull(),
    name: text('name').notNull(),
    location: text('location'),
    trucks: integer('trucks').default(0),
    ambulances: integer('ambulances').default(0),
    officers: integer('officers').default(0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const command_profiles = pgTable('command_profiles', {
    id: serial('id').primaryKey(),
    commander_id: text('commander_id').unique().notNull(),
    name: text('name').notNull(),
    rank: text('rank').notNull(),
    department: text('department').notNull(),
    permissions: jsonb('permissions').default([]),
    last_login: timestamp('last_login', { withTimezone: true }).defaultNow(),
});

export const mission_tasks = pgTable('mission_tasks', {
    id: serial('id').primaryKey(),
    task_id: text('task_id').unique().notNull(),
    incident_ref: text('incident_ref').references(() => incidents.incident_id),
    status: text('status').default('INGESTED'),
    assigned_hub: text('assigned_hub'),
    assigned_agent: text('assigned_agent'),
    priority_level: integer('priority_level').default(1),
    mission_objective: text('mission_objective'),
    resolution_summary: text('resolution_summary'),
    completed_at: timestamp('completed_at', { withTimezone: true }),
});
