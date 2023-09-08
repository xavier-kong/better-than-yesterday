import { relations, sql } from 'drizzle-orm';
import { boolean } from 'drizzle-orm/mysql-core';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = sqliteTable('users', {
    userId: text('user_id').primaryKey(),
    name: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const usersToItemsRelations = relations(users, ({ many }) => ({
    items: many(items),
}));

export const items = sqliteTable('items', {
    userId: text('user_id').notNull().references(() => users.userId),
    itemId: integer('item_id').primaryKey(),
    itemType: text('item_type', { enum: ['time', 'duration', 'amount', 'consistency']}).notNull(),
    itemName: text('item_name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    direction: text('direction', { enum: ['increase', 'decrease']})
});

export const itemsToLogsRelations = relations(items, ({ many }) => ({
    logs: many(logs),
}));

export const itemsToUserRelations = relations(items, ({ one }) => ({
    user: one(users, {
        fields: [items.userId],
        references: [users.userId]
    })
}));

export const insertItemsSchema = createInsertSchema(items);
export const selectItemsSchema = createSelectSchema(items);

export const logs = sqliteTable('logs', {
    logId: integer('log_id').notNull().primaryKey(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    itemId: integer('item_id').notNull().references(() => items.itemId),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`CURRENT_TIMESTAMP`),
    value: integer('amount'),
});

export const logsToItemsRelations = relations(logs, ({ one }) => ({
    item: one(items, {
        fields: [logs.itemId],
        references: [items.itemId]
    })
}));

export const insertLogsSchema = createInsertSchema(logs);
export const selectLogsSchema = createSelectSchema(logs);

