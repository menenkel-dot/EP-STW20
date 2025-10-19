// FIX: Populate constants.ts with mock data used throughout the application.
import { User, UserRole, Notification, Post, Event, Group, Document, Conversation, HolidayCareBooking, HolidayPeriod, Absence, Contact } from './types';

export const MOCK_GROUPS: Group[] = [
  { id: 1, name: 'Sonnengruppe' },
  { id: 2, name: 'Regenbogengruppe' },
  { id: 3, name: 'Sternengruppe' },
];

export const MOCK_USERS: User[] = [
  {
    id: 1,
    name: 'Familie Meier',
    username: 'meier',
    password: 'password',
    role: UserRole.PARENT,
    avatarUrl: 'https://i.pravatar.cc/150?u=meier',
    children: [
      { id: 101, name: 'Anna Meier', groupId: 1, avatarUrl: 'https://picsum.photos/seed/annameier/100/100' },
      { id: 102, name: 'Max Meier', groupId: 2, avatarUrl: 'https://picsum.photos/seed/maxmeier/100/100' },
    ],
  },
  {
    id: 2,
    name: 'Familie Huber',
    username: 'huber',
    password: 'password',
    role: UserRole.PARENT,
    avatarUrl: 'https://i.pravatar.cc/150?u=huber',
    children: [
      { id: 103, name: 'Sophie Huber', groupId: 1, avatarUrl: 'https://picsum.photos/seed/sophiehuber/100/100' },
    ],
  },
  {
    id: 99,
    name: 'Kita Leitung',
    username: 'admin',
    password: 'password',
    role: UserRole.ADMIN,
    avatarUrl: '',
    children: [],
  },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 1, message: 'Neue Elternpost: "Sommerfest Update"', read: false, type: 'info' },
  { id: 2, message: 'Anmeldung für Feriendienst endet bald!', read: false, type: 'alert' },
  { id: 3, message: 'Ihre Nachricht wurde erfolgreich versendet.', read: true, type: 'success' },
];

export const MOCK_POSTS: Post[] = [
    {
        id: 1,
        title: "Informationen zum Sommerfest",
        content: "Liebe Eltern,\n\nwir freuen uns, Ihnen mitteilen zu können, dass unser jährliches Sommerfest am 15. Juli stattfinden wird. Es wird Spiele, Essen und viel Spaß für die ganze Familie geben. Bitte tragen Sie sich in die Liste am Eingang ein, wenn Sie einen Kuchen oder Salat mitbringen möchten.\n\nWir freuen uns auf Sie!\nIhr Kita-Team",
        author: "Kita-Leitung",
        date: "15.06.2023",
        imageUrl: "https://images.unsplash.com/photo-1562504208-137fb2778558?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
        groupIds: [],
    },
    {
        id: 2,
        title: "Pädagogischer Tag im September",
        content: "Am 5. September findet unser pädagogischer Tag statt. An diesem Tag bleibt die Einrichtung für die Kinder geschlossen. Wir bitten um Ihr Verständnis.",
        author: "Kita-Leitung",
        date: "10.06.2023",
        groupIds: [1, 2, 3]
    },
];

export const MOCK_EVENTS: Event[] = [
    {
        id: 1,
        title: "Sommerfest",
        date: "15. Juli 2023",
        time: "14:00 Uhr",
        location: "Garten des Kinderhauses",
        description: "Großes Fest für Kinder, Eltern und Mitarbeiter mit Spielen, Grillen und gemütlichem Beisammensein.",
        groupIds: []
    },
    {
        id: 2,
        title: "Laternenumzug",
        date: "11. November 2023",
        time: "17:00 Uhr",
        location: "Treffpunkt am Kinderhaus",
        description: "Wir ziehen mit selbstgebastelten Laternen durch die Straßen.",
        groupIds: [1]
    },
];

export const MOCK_DOCUMENTS: Document[] = [
    { id: 1, name: "Einverständniserklärung Fotoaufnahmen.pdf", uploadDate: "10.01.2023", url: "#", userId: 1, childId: 101 },
    { id: 2, name: "Notfallkontaktblatt_Anna_Meier.pdf", uploadDate: "10.01.2023", url: "#", userId: 1, childId: 101 },
    { id: 3, name: "Notfallkontaktblatt_Max_Meier.pdf", uploadDate: "12.01.2023", url: "#", userId: 1, childId: 102 },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 1,
        participantIds: [1, 99], // Familie Meier & Admin
        messages: [
            { id: 101, senderId: 1, content: "Hallo liebes Kita-Team, wir haben eine Frage zur Anmeldung für den Feriendienst. Können wir unsere beiden Kinder auch nur für einzelne Tage anmelden? Viele Grüße, Familie Meier", timestamp: "2023-06-12T10:00:00Z" },
            { id: 102, senderId: 99, content: "Hallo Familie Meier, ja, das ist grundsätzlich möglich. Bitte vermerken Sie die gewünschten Tage einfach im Anmeldeformular. Viele Grüße, die Kita Leitung", timestamp: "2023-06-12T11:30:00Z" }
        ]
    },
    {
        id: 2,
        participantIds: [2, 99], // Familie Huber & Admin
        messages: [
            { id: 201, senderId: 2, content: "Guten Morgen, unsere Tochter Sophie kann heute leider nicht in die Kita kommen, da sie Fieber hat. MfG, Familie Huber", timestamp: "2023-06-15T07:15:00Z" },
            { id: 202, senderId: 99, content: "Guten Morgen Familie Huber, vielen Dank für die Info und gute Besserung für Sophie!", timestamp: "2023-06-15T07:45:00Z" }
        ]
    },
];


export const MOCK_HOLIDAY_PERIODS: HolidayPeriod[] = [
    { id: 1, name: "Pfingstferien 2024", startDate: "2024-05-20", endDate: "2024-05-31", deadline: "2024-04-20" },
    { id: 2, name: "Sommerferien 2024", startDate: "2024-07-29", endDate: "2024-08-16", deadline: "2024-06-29" },
    { id: 3, name: "Herbstferien 2024", startDate: "2024-10-28", endDate: "2024-11-01", deadline: "2024-09-28" },
];

export const MOCK_HOLIDAY_CARE_BOOKINGS: HolidayCareBooking[] = [
    { id: 1, childId: 101, periodId: 1, needsCare: true, bookedFromDate: "2024-05-20", bookedToDate: "2024-05-24", bookedFromTime: "08:00", bookedToTime: "14:00", withLunch: true },
    { id: 2, childId: 102, periodId: 1, needsCare: false },
    { id: 3, childId: 103, periodId: 2, needsCare: true, bookedFromDate: "2024-08-05", bookedToDate: "2024-08-09", bookedFromTime: "09:00", bookedToTime: "15:00", withLunch: false },
];

export const MOCK_ABSENCES: Absence[] = [
    { id: 1, childId: 103, startDate: "2023-06-15", endDate: "2023-06-15", reason: 'krank', symptoms: "Fieber und Husten", reportedAt: "2023-06-15T07:15:00Z" },
    { id: 2, childId: 101, startDate: "2023-06-16", endDate: "2023-06-16", reason: 'sonstige', symptoms: "Arzttermin", reportedAt: "2023-06-14T18:00:00Z" },
];

export const MOCK_CONTACTS: Contact[] = [
    { id: 1, name: 'Erika Mustermann', role: 'Leitung', phone: '0123-4567890', email: 'leitung@kita-stwolfgang.de' },
    { id: 2, name: 'Hans Meier', role: 'Gruppenleitung Sonnengruppe', phone: '0123-4567891', email: 'sonnengruppe@kita-stwolfgang.de' },
    { id: 3, name: 'Sabine Schmidt', role: 'Gruppenleitung Regenbogengruppe', phone: '0123-4567892', email: 'regenbogengruppe@kita-stwolfgang.de' },
    { id: 4, name: 'Peter Klein', role: 'Gruppenleitung Sternengruppe', phone: '0123-4567893', email: 'sternengruppe@kita-stwolfgang.de' },
];

export const MOCK_MENU_URL: string = 'https://www.catering-beispiel.de/speiseplan';