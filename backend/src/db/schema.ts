import { mysqlTable, serial, varchar, text, timestamp, boolean, int } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const users = mysqlTable('users', {
    id: int('id').autoincrement().primaryKey(),
    username: varchar('username', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 20 }).default('user').notNull(), // 'admin', 'user'
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const dbConnections = mysqlTable('db_connections', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // 'mysql', 'postgres'
    connectionString: text('connection_string').notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const queryConfigs = mysqlTable('query_configs', {
    id: int('id').autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    sqlQuery: text('sql_query').notNull(),
    scheduleCron: varchar('schedule_cron', { length: 50 }).notNull(),
    dbConnectionId: int('db_connection_id').notNull(),
    notifyDiscordWebhook: text('notify_discord_webhook'),
    notifyTelegramChatId: text('notify_telegram_chat_id'),
    resultTemplate: text('result_template'), // New field for formatting results
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const queryLogs = mysqlTable('query_logs', {
    id: int('id').autoincrement().primaryKey(),
    configId: int('config_id').references(() => queryConfigs.id),
    executedAt: timestamp('executed_at').default(sql`CURRENT_TIMESTAMP`),
    status: varchar('status', { length: 50 }).notNull(), // 'success', 'error'
    resultSummary: text('result_summary'),
    errorDetails: text('error_details'),
});

export const notificationLogs = mysqlTable('notification_logs', {
    id: int('id').autoincrement().primaryKey(),
    configId: int('config_id').references(() => queryConfigs.id),
    type: varchar('type', { length: 50 }).notNull(), // 'discord', 'telegram'
    status: varchar('status', { length: 50 }).notNull(), // 'success', 'error'
    message: text('message'),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});
