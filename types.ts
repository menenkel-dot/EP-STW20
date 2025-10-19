// FIX: Populate types.ts with all necessary type definitions for the application.

export enum UserRole {
  ADMIN = 'admin',
  PARENT = 'parent',
}

export interface Child {
  id: number;
  name: string;
  groupId: number;
  avatarUrl: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  children: Child[];
  avatarUrl: string;
}

export interface Notification {
  id: number;
  message: string;
  read: boolean;
  type: 'info' | 'alert' | 'success';
}

export type View = 'dashboard' | 'elternpost' | 'veranstaltungen' | 'feriendienst' | 'dokumente' | 'nachrichten' | 'verwaltung' | 'abwesenheit' | 'weitereInfos';

export interface Post {
    id: number;
    title: string;
    content: string;
    imageUrl?: string;
    author: string;
    date: string;
    groupIds?: number[];
}

export interface Event {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
    groupIds?: number[];
}

export interface Message {
    id: number;
    senderId: number; // 99 for admin, user.id for parent
    content: string;
    timestamp: string; // ISO 8601 format
}

export interface Conversation {
    id: number;
    participantIds: number[]; // e.g., [1, 99] for a chat between parent and admin
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
    userId: number;
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