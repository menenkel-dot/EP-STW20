// FIX: Populate types.ts with all necessary type definitions for the application.

export enum UserRole {
  ADMIN = 'admin',
  PARENT = 'parent',
  GRUPPENLEITUNG = 'gruppenleitung',
}

export interface Child {
  id: number;
  name: string;
  groupId: number;
  avatarUrl: string;
}

export interface User {
  id: string; // Changed from number to string for Supabase UUID
  name: string;
  username: string;
  role: UserRole;
  children: Child[];
  avatarUrl: string;
  assignedGroupId?: number;
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  type: 'info' | 'alert' | 'success';
}

export type View = 'dashboard' | 'elternpost' | 'veranstaltungen' | 'feriendienst' | 'dokumente' | 'nachrichten' | 'verwaltung' | 'abwesenheit' | 'weitereInfos' | 'datenschutz' | 'impressum' | 'wochenbericht';

export interface Post {
    id: number;
    title: string;
    content: string;
    imageUrl?: string;
    author: string;
    date: string;
    groupIds?: number[];
    createdAt: string;
}

export type EventType = 'event' | 'holiday' | 'closure';

export interface Event {
    id: number;
    title: string;
    date: string;
    endDate?: string;
    time: string;
    location: string;
    description: string;
    groupIds?: number[];
    eventType: EventType;
}

export interface Message {
    id: number;
    senderId: string; // Changed from number
    content: string;
    timestamp: string; // ISO 8601 format
}

export interface Conversation {
    id: number;
    participantIds: string[]; // Changed from number[]
    messages: Message[];
    subject?: string; // Optional for broadcast messages
}

export interface Group {
    id: number;
    name: string;
}

export interface Document {
    id: number;
    name: string;
    uploadDate: string;
    url: string;
    userId: string; // Changed from number
    childId: number;
}

export interface HolidayPeriod {
  id: number;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
}

export interface HolidayCareBooking {
  id: number;
  childId: number;
  periodId: number;
  needsCare: boolean;
  bookedFromDate?: string; // YYYY-MM-DD
  bookedToDate?: string; // YYYY-MM-DD
  bookedFromTime?: string; // HH:mm
  bookedToTime?: string; // HH:mm
  withLunch?: boolean;
  earlyService?: boolean;
}

export type AbsenceReason = 'krank' | 'sonstige';

export interface Absence {
    id: number;
    childId: number;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: AbsenceReason;
    symptoms?: string;
    reportedAt: string; // ISO 8601 format
}

export interface Contact {
    id: number;
    name: string;
    role: string;
    phone: string;
    email:string;
}

export interface WeeklyReport {
    id: number;
    groupId: number;
    groupName?: string;
    date: string; // YYYY-MM-DD
    dailyReport: string;
    createdAt?: string;
    updatedAt?: string;
}