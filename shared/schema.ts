import { pgTable, serial, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Benutzer-Tabelle
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('parent'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Kinder-Tabelle
export const children = pgTable('children', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: integer('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  groupId: integer('group_id'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Gruppen-Tabelle
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
});

// Abwesenheiten-Tabelle
export const absences = pgTable('absences', {
  id: serial('id').primaryKey(),
  childId: integer('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  startDate: varchar('start_date', { length: 10 }).notNull(),
  endDate: varchar('end_date', { length: 10 }).notNull(),
  reason: varchar('reason', { length: 50 }).notNull(),
  symptoms: text('symptoms'),
  reportedAt: timestamp('reported_at').defaultNow().notNull(),
});

// Dokumente-Tabelle
export const documents = pgTable('documents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  childId: integer('child_id').references(() => children.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  uploadDate: varchar('upload_date', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationen
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  documents: many(documents),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.parentId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [children.groupId],
    references: [groups.id],
  }),
  absences: many(absences),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  children: many(children),
}));

export const absencesRelations = relations(absences, ({ one }) => ({
  child: one(children, {
    fields: [absences.childId],
    references: [children.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [documents.childId],
    references: [children.id],
  }),
}));

// TypeScript Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Child = typeof children.$inferSelect;
export type InsertChild = typeof children.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type Absence = typeof absences.$inferSelect;
export type Document = typeof documents.$inferSelect;
