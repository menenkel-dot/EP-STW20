import { 
  users, children, groups, absences, documents, events, posts, holidayPeriods, holidayBookings, conversations, messages, contacts, notifications, settings,
  type User, type InsertUser, type Child, type InsertChild, type Group, 
  type Absence, type InsertAbsence, type Document, type Event, type InsertEvent,
  type Post, type InsertPost, type HolidayPeriod, type InsertHolidayPeriod,
  type HolidayBooking, type InsertHolidayBooking, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type Contact, type InsertContact, type Notification, type InsertNotification,
  type Setting, type InsertSetting
} from "../shared/schema.js";
import { db } from "./db.js";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getStaffUsers(): Promise<Pick<User, 'id' | 'name' | 'role'>[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Children Operations
  getChildrenByParentId(parentId: number): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(insertChild: InsertChild): Promise<Child>;
  
  // Groups Operations
  getAllGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  
  // Absences Operations
  getAllAbsences(): Promise<Absence[]>;
  getAbsencesByChildId(childId: number): Promise<Absence[]>;
  createAbsence(insertAbsence: InsertAbsence): Promise<Absence>;
  updateAbsence(id: number, updates: Partial<InsertAbsence>): Promise<Absence | undefined>;
  deleteAbsence(id: number): Promise<boolean>;
  
  // Documents Operations
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  getDocumentsByChildId(childId: number): Promise<Document[]>;
  
  // Events Operations
  getAllEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(insertEvent: InsertEvent): Promise<Event>;
  updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Posts Operations
  getAllPosts(): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(insertPost: InsertPost): Promise<Post>;
  updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Holiday Periods Operations
  getAllHolidayPeriods(): Promise<HolidayPeriod[]>;
  getHolidayPeriod(id: number): Promise<HolidayPeriod | undefined>;
  createHolidayPeriod(insertPeriod: InsertHolidayPeriod): Promise<HolidayPeriod>;
  updateHolidayPeriod(id: number, updates: Partial<InsertHolidayPeriod>): Promise<HolidayPeriod | undefined>;
  deleteHolidayPeriod(id: number): Promise<boolean>;
  
  // Holiday Bookings Operations
  getAllHolidayBookings(): Promise<HolidayBooking[]>;
  getHolidayBookingsByPeriodId(periodId: number): Promise<HolidayBooking[]>;
  getHolidayBookingsByChildId(childId: number): Promise<HolidayBooking[]>;
  createHolidayBooking(insertBooking: InsertHolidayBooking): Promise<HolidayBooking>;
  updateHolidayBooking(id: number, updates: Partial<InsertHolidayBooking>): Promise<HolidayBooking | undefined>;
  deleteHolidayBooking(id: number): Promise<boolean>;
  
  // Conversations Operations
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(insertConversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, lastMessageAt: Date): Promise<void>;
  
  // Messages Operations
  getMessagesByConversationId(conversationId: number): Promise<Message[]>;
  createMessage(insertMessage: InsertMessage): Promise<Message>;
  markMessageAsRead(id: number): Promise<void>;
  
  // Contacts Operations
  getAllContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(insertContact: InsertContact): Promise<Contact>;
  updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Notifications Operations
  getAllNotifications(userId: number): Promise<Notification[]>;
  createNotification(insertNotification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Settings Operations
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
}

export class DatabaseStorage implements IStorage {
  // User Operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async getStaffUsers(): Promise<Pick<User, 'id' | 'name' | 'role'>[]> {
    const staff = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, 'admin'));
    return staff;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Children Operations
  async getChildrenByParentId(parentId: number): Promise<Child[]> {
    return db.select().from(children).where(eq(children.parentId, parentId));
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child || undefined;
  }

  async createChild(insertChild: InsertChild): Promise<Child> {
    const [child] = await db
      .insert(children)
      .values(insertChild)
      .returning();
    return child;
  }

  async updateChild(id: number, updates: Partial<InsertChild>): Promise<Child | undefined> {
    const [child] = await db
      .update(children)
      .set(updates)
      .where(eq(children.id, id))
      .returning();
    return child || undefined;
  }

  async deleteChild(id: number): Promise<boolean> {
    const result = await db.delete(children).where(eq(children.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAllChildren(): Promise<Child[]> {
    return db.select().from(children);
  }

  // Groups Operations
  async getAllGroups(): Promise<Group[]> {
    return db.select().from(groups);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  // Absences Operations
  async getAllAbsences(): Promise<Absence[]> {
    return db.select().from(absences).orderBy(desc(absences.reportedAt));
  }

  async getAbsencesByChildId(childId: number): Promise<Absence[]> {
    return db.select().from(absences).where(eq(absences.childId, childId));
  }

  async createAbsence(insertAbsence: InsertAbsence): Promise<Absence> {
    const [absence] = await db
      .insert(absences)
      .values(insertAbsence)
      .returning();
    return absence;
  }

  async updateAbsence(id: number, updates: Partial<InsertAbsence>): Promise<Absence | undefined> {
    const [absence] = await db
      .update(absences)
      .set(updates)
      .where(eq(absences.id, id))
      .returning();
    return absence || undefined;
  }

  async deleteAbsence(id: number): Promise<boolean> {
    const result = await db.delete(absences).where(eq(absences.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Documents Operations
  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId));
  }

  async getDocumentsByChildId(childId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.childId, childId));
  }

  // Events Operations
  async getAllEvents(): Promise<Event[]> {
    return db.select().from(events);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: number, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Posts Operations
  async getAllPosts(): Promise<Post[]> {
    return db.select().from(posts);
  }

  async getPost(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post || undefined;
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db
      .insert(posts)
      .values(insertPost)
      .returning();
    return post;
  }

  async updatePost(id: number, updates: Partial<InsertPost>): Promise<Post | undefined> {
    const [post] = await db
      .update(posts)
      .set(updates)
      .where(eq(posts.id, id))
      .returning();
    return post || undefined;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Holiday Periods Operations
  async getAllHolidayPeriods(): Promise<HolidayPeriod[]> {
    return db.select().from(holidayPeriods);
  }

  async getHolidayPeriod(id: number): Promise<HolidayPeriod | undefined> {
    const [period] = await db.select().from(holidayPeriods).where(eq(holidayPeriods.id, id));
    return period || undefined;
  }

  async createHolidayPeriod(insertPeriod: InsertHolidayPeriod): Promise<HolidayPeriod> {
    const [period] = await db
      .insert(holidayPeriods)
      .values(insertPeriod)
      .returning();
    return period;
  }

  async updateHolidayPeriod(id: number, updates: Partial<InsertHolidayPeriod>): Promise<HolidayPeriod | undefined> {
    const [period] = await db
      .update(holidayPeriods)
      .set(updates)
      .where(eq(holidayPeriods.id, id))
      .returning();
    return period || undefined;
  }

  async deleteHolidayPeriod(id: number): Promise<boolean> {
    const result = await db.delete(holidayPeriods).where(eq(holidayPeriods.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Holiday Bookings Operations
  async getAllHolidayBookings(): Promise<HolidayBooking[]> {
    return db.select().from(holidayBookings);
  }

  async getHolidayBookingsByPeriodId(periodId: number): Promise<HolidayBooking[]> {
    return db.select().from(holidayBookings).where(eq(holidayBookings.periodId, periodId));
  }

  async getHolidayBookingsByChildId(childId: number): Promise<HolidayBooking[]> {
    return db.select().from(holidayBookings).where(eq(holidayBookings.childId, childId));
  }

  async createHolidayBooking(insertBooking: InsertHolidayBooking): Promise<HolidayBooking> {
    const [booking] = await db
      .insert(holidayBookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateHolidayBooking(id: number, updates: Partial<InsertHolidayBooking>): Promise<HolidayBooking | undefined> {
    const [booking] = await db
      .update(holidayBookings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(holidayBookings.id, id))
      .returning();
    return booking || undefined;
  }

  async deleteHolidayBooking(id: number): Promise<boolean> {
    const result = await db.delete(holidayBookings).where(eq(holidayBookings.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Conversations Operations
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    const allConversations = await db.select().from(conversations);
    return allConversations.filter(conv => {
      const participantIds = JSON.parse(conv.participantIds);
      return participantIds.includes(userId);
    });
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const [conversation] = await db
      .insert(conversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async updateConversation(id: number, lastMessageAt: Date): Promise<void> {
    await db
      .update(conversations)
      .set({ lastMessageAt })
      .where(eq(conversations.id, id));
  }

  async deleteConversation(id: number): Promise<boolean> {
    const result = await db.delete(conversations).where(eq(conversations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Messages Operations
  async getMessagesByConversationId(conversationId: number): Promise<Message[]> {
    return db.select().from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.timestamp));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id));
  }

  // Contacts Operations
  async getAllContacts(): Promise<Contact[]> {
    return db.select().from(contacts);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async updateContact(id: number, updates: Partial<InsertContact>): Promise<Contact | undefined> {
    const [contact] = await db
      .update(contacts)
      .set(updates)
      .where(eq(contacts.id, id))
      .returning();
    return contact || undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts).where(eq(contacts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Notifications Operations
  async getAllNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db.delete(notifications).where(eq(notifications.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Settings Operations
  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    const existingSetting = await this.getSetting(key);
    
    if (existingSetting) {
      const [updated] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
