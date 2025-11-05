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
  assignedGroupId: integer('assigned_group_id').references(() => groups.id, { onDelete: 'set null' }),
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

// Veranstaltungen-Tabelle
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  date: varchar('date', { length: 100 }).notNull(),
  time: varchar('time', { length: 50 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description').notNull(),
  groupIds: text('group_ids'),
  eventType: varchar('event_type', { length: 50 }).notNull().default('event'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Elternpost-Tabelle
export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  author: varchar('author', { length: 255 }).notNull(),
  date: varchar('date', { length: 20 }).notNull(),
  imageUrl: text('image_url'),
  groupIds: text('group_ids'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ferienzeiträume-Tabelle
export const holidayPeriods = pgTable('holiday_periods', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: varchar('start_date', { length: 10 }).notNull(),
  endDate: varchar('end_date', { length: 10 }).notNull(),
  deadline: varchar('deadline', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Feriendienst-Buchungen-Tabelle
export const holidayBookings = pgTable('holiday_bookings', {
  id: serial('id').primaryKey(),
  periodId: integer('period_id').notNull().references(() => holidayPeriods.id, { onDelete: 'cascade' }),
  childId: integer('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  needsCare: boolean('needs_care').notNull(),
  fromDate: varchar('from_date', { length: 10 }),
  toDate: varchar('to_date', { length: 10 }),
  fromTime: varchar('from_time', { length: 10 }),
  toTime: varchar('to_time', { length: 10 }),
  withLunch: boolean('with_lunch').default(false),
  earlyService: boolean('early_service').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Konversationen-Tabelle
export const conversations = pgTable('conversations', {
  id: serial('id').primaryKey(),
  participantIds: text('participant_ids').notNull(),
  lastMessageAt: timestamp('last_message_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Nachrichten-Tabelle
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: integer('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: integer('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  read: boolean('read').default(false),
});

// Kontakte-Tabelle
export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  role: varchar('role', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Benachrichtigungen-Tabelle
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull().default('info'),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Settings-Tabelle
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relationen
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  documents: many(documents),
  notifications: many(notifications),
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

export const holidayPeriodsRelations = relations(holidayPeriods, ({ many }) => ({
  bookings: many(holidayBookings),
}));

export const holidayBookingsRelations = relations(holidayBookings, ({ one }) => ({
  period: one(holidayPeriods, {
    fields: [holidayBookings.periodId],
    references: [holidayPeriods.id],
  }),
  child: one(children, {
    fields: [holidayBookings.childId],
    references: [children.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// TypeScript Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Child = typeof children.$inferSelect;
export type InsertChild = typeof children.$inferInsert;
export type Group = typeof groups.$inferSelect;
export type Absence = typeof absences.$inferSelect;
export type InsertAbsence = typeof absences.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type HolidayPeriod = typeof holidayPeriods.$inferSelect;
export type InsertHolidayPeriod = typeof holidayPeriods.$inferInsert;
export type HolidayBooking = typeof holidayBookings.$inferSelect;
export type InsertHolidayBooking = typeof holidayBookings.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = typeof settings.$inferInsert;
