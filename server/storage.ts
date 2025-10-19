import { users, children, groups, absences, documents, type User, type InsertUser, type Child, type InsertChild, type Group, type Absence, type Document } from "../shared/schema.js";
import { db } from "./db.js";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User Operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Children Operations
  getChildrenByParentId(parentId: number): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(insertChild: InsertChild): Promise<Child>;
  
  // Groups Operations
  getAllGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | undefined>;
  
  // Absences Operations
  getAbsencesByChildId(childId: number): Promise<Absence[]>;
  
  // Documents Operations
  getDocumentsByUserId(userId: number): Promise<Document[]>;
  getDocumentsByChildId(childId: number): Promise<Document[]>;
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

  // Groups Operations
  async getAllGroups(): Promise<Group[]> {
    return db.select().from(groups);
  }

  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  // Absences Operations
  async getAbsencesByChildId(childId: number): Promise<Absence[]> {
    return db.select().from(absences).where(eq(absences.childId, childId));
  }

  // Documents Operations
  async getDocumentsByUserId(userId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId));
  }

  async getDocumentsByChildId(childId: number): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.childId, childId));
  }
}

export const storage = new DatabaseStorage();
