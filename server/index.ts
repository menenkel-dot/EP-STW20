import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { storage } from './storage.js';
import { db } from './db.js';
import { users, documents, holidayBookings, conversations, messages } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyToken, 
  hashPassword, 
  comparePassword,
  authenticateToken,
  type AuthRequest 
} from './auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// ==================== AUTH ROUTES ====================

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    }

    const user = await storage.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
    }

    // Kinder des Benutzers laden
    const children = await storage.getChildrenByParentId(user.id);

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        assignedGroupId: user.assignedGroupId,
        children: children
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Serverfehler beim Login' });
  }
});

// Refresh Token
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh Token erforderlich' });
    }

    const payload = verifyToken(refreshToken);
    if (!payload) {
      return res.status(403).json({ error: 'Ungültiger Refresh Token' });
    }

    const newToken = generateToken({
      userId: payload.userId,
      username: payload.username,
      role: payload.role
    });

    res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Serverfehler beim Token-Refresh' });
  }
});

// Register (nur für Entwicklung - in Produktion deaktiviert)
app.post('/api/auth/register', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Nur Admins dürfen neue Benutzer erstellen
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren dürfen Benutzer erstellen' });
    }

    const { username, password, name, email, role, assignedGroupId } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Benutzername, Passwort und Name erforderlich' });
    }

    // Validate assignedGroupId for gruppenleitung
    if (role === 'gruppenleitung' && !assignedGroupId) {
      return res.status(400).json({ error: 'Gruppenleitung muss eine Gruppe zugewiesen werden' });
    }

    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ error: 'Benutzername bereits vergeben' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await storage.createUser({
      username,
      password: hashedPassword,
      name,
      email: email || null,
      role: role || 'parent',
      avatarUrl: null,
      assignedGroupId: assignedGroupId || null
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        assignedGroupId: user.assignedGroupId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Serverfehler bei der Registrierung' });
  }
});

// Get Current User (geschützte Route)
app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    const children = await storage.getChildrenByParentId(user.id);

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      assignedGroupId: user.assignedGroupId,
      children: children
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== USER ROUTES ====================

// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const users = await storage.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Get staff/admin users (accessible to all authenticated users, for displaying names in messages)
app.get('/api/users/staff', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const currentUser = await storage.getUser(req.user.userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    let result: Array<{id: number, name: string, role: string, assignedGroupId?: number | null}> = [];

    if (currentUser.role === 'admin') {
      // Admins sehen alle Eltern
      const parents = await db.select({
        id: users.id,
        name: users.name,
        role: users.role,
      }).from(users).where(eq(users.role, 'parent'));
      result = parents;
    } else if (currentUser.role === 'gruppenleitung') {
      // Gruppenleitungen sehen nur Eltern mit Kindern in ihrer Gruppe
      if (!currentUser.assignedGroupId) {
        return res.status(400).json({ error: 'Gruppenleitung hat keine zugewiesene Gruppe' });
      }
      const parents = await storage.getParentsByGroupId(currentUser.assignedGroupId);
      result = parents;
    } else if (currentUser.role === 'parent') {
      // Eltern sehen Admins + Gruppenleitungen der Gruppen, in denen ihre Kinder sind
      const userChildren = await storage.getChildrenByParentId(req.user.userId);
      const groupIds = [...new Set(userChildren.map(c => c.groupId).filter((id): id is number => id !== null))];
      const staff = await storage.getStaffByGroupIds(groupIds);
      result = staff;
    }

    res.json(result);
  } catch (error) {
    console.error('Get staff users error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const userId = parseInt(req.params.id);
    
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' });
    }

    const deleted = await storage.deleteUser(userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    res.json({ message: 'Benutzer erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen des Benutzers' });
  }
});

// Export user data (DSGVO - Recht auf Datenübertragbarkeit)
app.get('/api/users/:id/export', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Nur eigene Daten exportieren oder Admin
    if (req.user?.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }

    // Sammle alle Benutzerdaten
    const userChildren = await storage.getChildrenByParentId(userId);
    const absences = await Promise.all(
      userChildren.map(child => storage.getAbsencesByChildId(child.id))
    );
    const userDocuments = await db.select().from(documents).where(eq(documents.userId, userId));
    const userHolidayBookings = await Promise.all(
      userChildren.map(child => db.select().from(holidayBookings).where(eq(holidayBookings.childId, child.id)))
    );
    
    // Nachrichten
    const userConversations = await db.select().from(conversations);
    const userMessages = await Promise.all(
      userConversations.map(conv => {
        const participantIds = JSON.parse(conv.participantIds);
        if (participantIds.includes(userId)) {
          return db.select().from(messages).where(eq(messages.conversationId, conv.id));
        }
        return Promise.resolve([]);
      })
    );

    // Erstelle Export-Objekt
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      children: userChildren,
      absences: absences.flat(),
      documents: userDocuments,
      holidayBookings: userHolidayBookings.flat(),
      messages: userMessages.flat()
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="datenexport-${user.username}-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Export user data error:', error);
    res.status(500).json({ error: 'Serverfehler beim Datenexport' });
  }
});

// ==================== CHILDREN ROUTES ====================

// Get children for current user (or all for admin)
app.get('/api/children', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Admin can see all children
    if (req.user.role === 'admin') {
      const children = await storage.getAllChildren();
      return res.json(children);
    }

    // Parents see only their own children
    const children = await storage.getChildrenByParentId(req.user.userId);
    res.json(children);
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create a new child (admin only)
app.post('/api/children', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const { name, parentId, groupId, avatarUrl } = req.body;

    if (!name || !parentId) {
      return res.status(400).json({ error: 'Name und Eltern-ID sind erforderlich' });
    }

    const child = await storage.createChild({
      name,
      parentId,
      groupId: groupId || null,
      avatarUrl: avatarUrl || `https://picsum.photos/seed/${name.toLowerCase().replace(' ', '')}/100/100`,
    });

    res.status(201).json(child);
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({ error: 'Serverfehler beim Erstellen des Kindes' });
  }
});

// Update a child (admin only)
app.put('/api/children/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const childId = parseInt(req.params.id);
    const { name, groupId, avatarUrl } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (groupId !== undefined) updates.groupId = groupId;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    const child = await storage.updateChild(childId, updates);

    if (!child) {
      return res.status(404).json({ error: 'Kind nicht gefunden' });
    }

    res.json(child);
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren des Kindes' });
  }
});

// Delete a child (admin only)
app.delete('/api/children/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const childId = parseInt(req.params.id);
    const deleted = await storage.deleteChild(childId);

    if (!deleted) {
      return res.status(404).json({ error: 'Kind nicht gefunden' });
    }

    res.json({ message: 'Kind erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen des Kindes' });
  }
});

// ==================== GROUPS ROUTES ====================

// Get all groups
app.get('/api/groups', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const groups = await storage.getAllGroups();
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== DOCUMENTS ROUTES ====================

// Get documents (Admin: all, Parents: only their children's documents)
app.get('/api/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Admin sieht alle Dokumente
    if (req.user.role === 'admin') {
      const documents = await storage.getAllDocuments();
      return res.json(documents);
    }

    // Eltern sehen nur Dokumente ihrer Kinder
    if (req.user.role === 'parent') {
      const children = await storage.getChildrenByParentId(req.user.userId);
      const allDocuments: any[] = [];
      
      for (const child of children) {
        const childDocuments = await storage.getDocumentsByChildId(child.id);
        allDocuments.push(...childDocuments);
      }
      
      return res.json(allDocuments);
    }

    return res.status(403).json({ error: 'Zugriff verweigert' });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Upload document (Admin only)
app.post('/api/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Nur Admins können Dokumente hochladen' });
    }

    const { name, childId, fileData } = req.body;

    if (!name || !fileData) {
      return res.status(400).json({ error: 'Name und Datei erforderlich' });
    }

    // Validiere childId falls vorhanden
    if (childId) {
      const child = await storage.getChild(childId);
      if (!child) {
        return res.status(404).json({ error: 'Kind nicht gefunden' });
      }
    }

    const uploadDate = new Date().toISOString().split('T')[0];
    const document = await storage.createDocument(
      name,
      req.user.userId,
      childId || null,
      fileData,
      uploadDate
    );

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Serverfehler beim Hochladen' });
  }
});

// Delete document (Admin only)
app.delete('/api/documents/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Nur Admins können Dokumente löschen' });
    }

    const documentId = parseInt(req.params.id);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: 'Ungültige Dokument-ID' });
    }

    const deleted = await storage.deleteDocument(documentId);
    if (!deleted) {
      return res.status(404).json({ error: 'Dokument nicht gefunden' });
    }

    res.json({ message: 'Dokument erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen' });
  }
});

// ==================== ABSENCES ROUTES ====================

// Get all absences (admin and gruppenleitung)
app.get('/api/absences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Admin can see all absences
    if (req.user.role === 'admin') {
      const absences = await storage.getAllAbsences();
      return res.json(absences);
    }

    // Gruppenleitung can see absences for their assigned group
    if (req.user.role === 'gruppenleitung') {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.assignedGroupId) {
        return res.status(403).json({ error: 'Keine Gruppe zugewiesen' });
      }
      const absences = await storage.getAbsencesByGroupId(user.assignedGroupId);
      return res.json(absences);
    }

    // Parents cannot access this endpoint
    return res.status(403).json({ error: 'Zugriff verweigert' });
  } catch (error) {
    console.error('Get all absences error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Get absences for a child
app.get('/api/absences/:childId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const childId = parseInt(req.params.childId);
    
    // Sicherheit: Prüfe ob das Kind zum authentifizierten Benutzer gehört
    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: 'Kind nicht gefunden' });
    }

    if (child.parentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Dieses Kind gehört nicht zu Ihrem Konto' });
    }

    const absences = await storage.getAbsencesByChildId(childId);
    res.json(absences);
  } catch (error) {
    console.error('Get absences error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create absence
app.post('/api/absences', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { childId, startDate, endDate, reason, symptoms } = req.body;

    if (!childId || !startDate || !endDate || !reason) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
    }

    // Verify child ownership
    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: 'Kind nicht gefunden' });
    }

    if (child.parentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const absence = await storage.createAbsence({
      childId,
      startDate,
      endDate,
      reason,
      symptoms: symptoms || null
    });

    // Create notifications for all admin users
    try {
      const allUsers = await storage.getAllUsers();
      const adminUsers = allUsers.filter(u => u.role === 'admin');
      
      const reasonText = reason === 'krank' ? 'Krank' :
                        reason === 'urlaub' ? 'Urlaub' :
                        reason === 'termin' ? 'Termin' : reason;
      
      const notificationPromises = adminUsers.map(admin =>
        storage.createNotification({
          userId: admin.id,
          message: `Neue Abwesenheit gemeldet: ${child.name} (${reasonText}, ${startDate} - ${endDate})`,
          type: 'info'
        })
      );
      
      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Error creating admin notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json(absence);
  } catch (error) {
    console.error('Create absence error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Update absence
app.put('/api/absences/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    const updates = req.body;

    const absence = await storage.updateAbsence(id, updates);
    if (!absence) {
      return res.status(404).json({ error: 'Abwesenheit nicht gefunden' });
    }

    res.json(absence);
  } catch (error) {
    console.error('Update absence error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete absence
app.delete('/api/absences/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    const success = await storage.deleteAbsence(id);

    if (!success) {
      return res.status(404).json({ error: 'Abwesenheit nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete absence error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== EVENTS ROUTES ====================

// Get all events
app.get('/api/events', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const events = await storage.getAllEvents();
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create event (admin and gruppenleitung)
app.post('/api/events', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { title, date, time, location, description, groupIds } = req.body;

    if (!title || !date || !time || !location || !description) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
    }

    // Gruppenleitung can only create events for their assigned group
    if (req.user.role === 'gruppenleitung') {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.assignedGroupId) {
        return res.status(403).json({ error: 'Keine Gruppe zugewiesen' });
      }
      
      // Ensure groupIds contains only their assigned group
      if (!groupIds || !Array.isArray(groupIds) || groupIds.length !== 1 || groupIds[0] !== user.assignedGroupId) {
        return res.status(403).json({ error: 'Sie können nur Veranstaltungen für Ihre zugewiesene Gruppe erstellen' });
      }
    }

    // Admin has no restrictions
    if (req.user.role !== 'admin' && req.user.role !== 'gruppenleitung') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const event = await storage.createEvent({
      title,
      date,
      time,
      location,
      description,
      groupIds: groupIds ? JSON.stringify(groupIds) : null
    });

    // Benachrichtigungen an betroffene Eltern senden
    try {
      let parentsToNotify: number[] = [];
      
      if (!groupIds || groupIds.length === 0) {
        // Keine Gruppen ausgewählt = alle Eltern benachrichtigen
        const parents = await storage.getAllParents();
        parentsToNotify = parents.map(p => p.id);
      } else {
        // Nur Eltern mit Kindern in den ausgewählten Gruppen
        const parentsSet = new Set<number>();
        for (const groupId of groupIds) {
          const parents = await storage.getParentsByGroupId(groupId);
          parents.forEach(p => parentsSet.add(p.id));
        }
        parentsToNotify = Array.from(parentsSet);
      }

      const notificationPromises = parentsToNotify.map(parentId =>
        storage.createNotification({
          userId: parentId,
          message: `Neue Veranstaltung: ${title} am ${date} um ${time}`,
          type: 'info'
        })
      );

      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Error creating event notifications:', notifError);
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Update event (admin and gruppenleitung)
app.put('/api/events/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    const { title, date, time, location, description, groupIds } = req.body;

    // Gruppenleitung can only edit events for their assigned group
    if (req.user.role === 'gruppenleitung') {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.assignedGroupId) {
        return res.status(403).json({ error: 'Keine Gruppe zugewiesen' });
      }
      
      // Check if event belongs to their group
      const existingEvent = await storage.getEvent(id);
      if (!existingEvent) {
        return res.status(404).json({ error: 'Veranstaltung nicht gefunden' });
      }
      
      const eventGroupIds = existingEvent.groupIds ? JSON.parse(existingEvent.groupIds) : [];
      if (!eventGroupIds.includes(user.assignedGroupId)) {
        return res.status(403).json({ error: 'Sie können nur Veranstaltungen Ihrer Gruppe bearbeiten' });
      }
      
      // Ensure groupIds are not changed to other groups
      if (groupIds !== undefined) {
        if (!Array.isArray(groupIds) || groupIds.length !== 1 || groupIds[0] !== user.assignedGroupId) {
          return res.status(403).json({ error: 'Sie können die Gruppe nicht ändern' });
        }
      }
    }

    // Admin has no restrictions
    if (req.user.role !== 'admin' && req.user.role !== 'gruppenleitung') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (date) updates.date = date;
    if (time) updates.time = time;
    if (location) updates.location = location;
    if (description) updates.description = description;
    if (groupIds !== undefined) updates.groupIds = groupIds ? JSON.stringify(groupIds) : null;

    const event = await storage.updateEvent(id, updates);
    if (!event) {
      return res.status(404).json({ error: 'Veranstaltung nicht gefunden' });
    }

    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete event (admin only)
app.delete('/api/events/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const id = parseInt(req.params.id);
    const success = await storage.deleteEvent(id);

    if (!success) {
      return res.status(404).json({ error: 'Veranstaltung nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== POSTS ROUTES ====================

// Get all posts
app.get('/api/posts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const posts = await storage.getAllPosts();
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create post (admin only)
app.post('/api/posts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const { title, content, author, date, imageUrl, groupIds } = req.body;

    if (!title || !content || !author || !date) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
    }

    const post = await storage.createPost({
      title,
      content,
      author,
      date,
      imageUrl: imageUrl || null,
      groupIds: groupIds ? JSON.stringify(groupIds) : null
    });

    // Benachrichtigungen an betroffene Eltern senden
    try {
      let parentsToNotify: number[] = [];
      
      if (!groupIds || groupIds.length === 0) {
        // Keine Gruppen ausgewählt = alle Eltern benachrichtigen
        const parents = await storage.getAllParents();
        parentsToNotify = parents.map(p => p.id);
      } else {
        // Nur Eltern mit Kindern in den ausgewählten Gruppen
        const parentsSet = new Set<number>();
        for (const groupId of groupIds) {
          const parents = await storage.getParentsByGroupId(groupId);
          parents.forEach(p => parentsSet.add(p.id));
        }
        parentsToNotify = Array.from(parentsSet);
      }

      const notificationPromises = parentsToNotify.map(parentId =>
        storage.createNotification({
          userId: parentId,
          message: `Neue Elternpost: ${title}`,
          type: 'info'
        })
      );

      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Error creating post notifications:', notifError);
    }

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Update post (admin only)
app.put('/api/posts/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const id = parseInt(req.params.id);
    const { title, content, author, date, imageUrl, groupIds } = req.body;

    const updates: any = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (author) updates.author = author;
    if (date) updates.date = date;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (groupIds !== undefined) updates.groupIds = groupIds ? JSON.stringify(groupIds) : null;

    const post = await storage.updatePost(id, updates);
    if (!post) {
      return res.status(404).json({ error: 'Beitrag nicht gefunden' });
    }

    res.json(post);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete post (admin only)
app.delete('/api/posts/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const id = parseInt(req.params.id);
    const success = await storage.deletePost(id);

    if (!success) {
      return res.status(404).json({ error: 'Beitrag nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== HOLIDAY PERIODS ROUTES ====================

// Get all holiday periods
app.get('/api/holiday-periods', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const periods = await storage.getAllHolidayPeriods();
    res.json(periods);
  } catch (error) {
    console.error('Get holiday periods error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create holiday period (admin only)
app.post('/api/holiday-periods', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const { name, startDate, endDate, deadline } = req.body;

    if (!name || !startDate || !endDate || !deadline) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
    }

    const period = await storage.createHolidayPeriod({
      name,
      startDate,
      endDate,
      deadline
    });

    // Benachrichtigungen an alle Eltern senden
    try {
      const parents = await storage.getAllParents();
      
      const notificationPromises = parents.map(parent =>
        storage.createNotification({
          userId: parent.id,
          message: `Neuer Feriendienst-Zeitraum: ${name} (Frist: ${deadline})`,
          type: 'info'
        })
      );
      
      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Error creating holiday period notifications:', notifError);
    }

    res.status(201).json(period);
  } catch (error) {
    console.error('Create holiday period error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Update holiday period (admin only)
app.put('/api/holiday-periods/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const id = parseInt(req.params.id);
    const updates = req.body;

    const period = await storage.updateHolidayPeriod(id, updates);
    if (!period) {
      return res.status(404).json({ error: 'Ferienzeitraum nicht gefunden' });
    }

    res.json(period);
  } catch (error) {
    console.error('Update holiday period error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete holiday period (admin only)
app.delete('/api/holiday-periods/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const id = parseInt(req.params.id);
    const success = await storage.deleteHolidayPeriod(id);

    if (!success) {
      return res.status(404).json({ error: 'Ferienzeitraum nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete holiday period error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== HOLIDAY BOOKINGS ROUTES ====================

// Helper function to map database booking fields to frontend expected fields
const mapBookingToFrontend = (booking: any) => ({
  ...booking,
  bookedFromDate: booking.fromDate,
  bookedToDate: booking.toDate,
  bookedFromTime: booking.fromTime,
  bookedToTime: booking.toTime
});

// Get all holiday bookings (admin and gruppenleitung)
app.get('/api/holiday-bookings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    // Admin can see all bookings
    if (req.user.role === 'admin') {
      const bookings = await storage.getAllHolidayBookings();
      return res.json(bookings.map(mapBookingToFrontend));
    }

    // Gruppenleitung can see bookings for their assigned group
    if (req.user.role === 'gruppenleitung') {
      const user = await storage.getUser(req.user.userId);
      if (!user || !user.assignedGroupId) {
        return res.status(403).json({ error: 'Keine Gruppe zugewiesen' });
      }
      const bookings = await storage.getHolidayBookingsByGroupId(user.assignedGroupId);
      return res.json(bookings.map(mapBookingToFrontend));
    }

    // Parents cannot access this endpoint
    return res.status(403).json({ error: 'Zugriff verweigert' });
  } catch (error) {
    console.error('Get holiday bookings error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Get holiday bookings by period
app.get('/api/holiday-bookings/period/:periodId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const periodId = parseInt(req.params.periodId);
    const bookings = await storage.getHolidayBookingsByPeriodId(periodId);
    res.json(bookings.map(mapBookingToFrontend));
  } catch (error) {
    console.error('Get holiday bookings by period error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Get holiday bookings by child
app.get('/api/holiday-bookings/child/:childId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const childId = parseInt(req.params.childId);

    // Verify child ownership
    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: 'Kind nicht gefunden' });
    }

    if (child.parentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const bookings = await storage.getHolidayBookingsByChildId(childId);
    res.json(bookings.map(mapBookingToFrontend));
  } catch (error) {
    console.error('Get holiday bookings by child error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create holiday booking
app.post('/api/holiday-bookings', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { periodId, childId, needsCare, fromDate, toDate, fromTime, toTime, withLunch } = req.body;

    if (periodId === undefined || childId === undefined || needsCare === undefined) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
    }

    // Verify child ownership
    const child = await storage.getChild(childId);
    if (!child) {
      return res.status(404).json({ error: 'Kind nicht gefunden' });
    }

    if (child.parentId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const booking = await storage.createHolidayBooking({
      periodId,
      childId,
      needsCare,
      fromDate: fromDate || null,
      toDate: toDate || null,
      fromTime: fromTime || null,
      toTime: toTime || null,
      withLunch: withLunch || false
    });

    res.status(201).json(mapBookingToFrontend(booking));
  } catch (error) {
    console.error('Create holiday booking error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Update holiday booking
app.put('/api/holiday-bookings/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    const updates = req.body;

    const booking = await storage.updateHolidayBooking(id, updates);
    if (!booking) {
      return res.status(404).json({ error: 'Buchung nicht gefunden' });
    }

    res.json(mapBookingToFrontend(booking));
  } catch (error) {
    console.error('Update holiday booking error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete holiday booking
app.delete('/api/holiday-bookings/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    const success = await storage.deleteHolidayBooking(id);

    if (!success) {
      return res.status(404).json({ error: 'Buchung nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete holiday booking error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== CONVERSATIONS ROUTES ====================

// Get conversations for current user
app.get('/api/conversations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    let conversations = await storage.getConversationsByUserId(req.user.userId);

    // Für Gruppenleitungen: Nur Konversationen mit Eltern ihrer Gruppe anzeigen
    if (req.user.role === 'gruppenleitung') {
      const currentUser = await storage.getUser(req.user.userId);
      if (!currentUser || !currentUser.assignedGroupId) {
        return res.status(400).json({ error: 'Gruppenleitung hat keine zugewiesene Gruppe' });
      }

      // Hole alle Eltern der zugewiesenen Gruppe
      const allowedParents = await storage.getParentsByGroupId(currentUser.assignedGroupId);
      const allowedParentIds = allowedParents.map(p => p.id);

      // Filtere Konversationen: Alle Teilnehmer (außer Gruppenleitung selbst) müssen Eltern der Gruppe sein
      conversations = conversations.filter(conv => {
        const participantIds: number[] = JSON.parse(conv.participantIds);
        const otherParticipants = participantIds.filter(id => id !== req.user!.userId);
        return otherParticipants.every(id => allowedParentIds.includes(id));
      });
    }

    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create conversation
app.post('/api/conversations', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ error: 'Fehlende oder ungültige participantIds' });
    }

    // Validierung: Gruppenleitung darf nur mit Eltern ihrer Gruppe kommunizieren
    if (req.user.role === 'gruppenleitung') {
      const currentUser = await storage.getUser(req.user.userId);
      if (!currentUser || !currentUser.assignedGroupId) {
        return res.status(400).json({ error: 'Gruppenleitung hat keine zugewiesene Gruppe' });
      }

      const allowedParents = await storage.getParentsByGroupId(currentUser.assignedGroupId);
      const allowedParentIds = allowedParents.map(p => p.id);

      const otherParticipants = participantIds.filter(id => id !== req.user!.userId);
      const allAllowed = otherParticipants.every(id => allowedParentIds.includes(id));

      if (!allAllowed) {
        return res.status(403).json({ error: 'Gruppenleitung darf nur mit Eltern ihrer Gruppe kommunizieren' });
      }
    }

    // Validierung: Eltern dürfen nur mit Admins und Gruppenleitungen ihrer Kindergruppen kommunizieren
    if (req.user.role === 'parent') {
      const userChildren = await storage.getChildrenByParentId(req.user.userId);
      const groupIds = [...new Set(userChildren.map(c => c.groupId).filter((id): id is number => id !== null))];
      const allowedStaff = await storage.getStaffByGroupIds(groupIds);
      const allowedStaffIds = allowedStaff.map(s => s.id);

      const otherParticipants = participantIds.filter(id => id !== req.user!.userId);
      const allAllowed = otherParticipants.every(id => allowedStaffIds.includes(id));

      if (!allAllowed) {
        return res.status(403).json({ error: 'Eltern dürfen nur mit Admins und Gruppenleitungen ihrer Kindergruppen kommunizieren' });
      }
    }

    const conversation = await storage.createConversation({
      participantIds: JSON.stringify(participantIds)
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete a conversation (admin only)
app.delete('/api/conversations/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const conversationId = parseInt(req.params.id);
    const deleted = await storage.deleteConversation(conversationId);

    if (!deleted) {
      return res.status(404).json({ error: 'Konversation nicht gefunden' });
    }

    res.json({ message: 'Konversation erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen der Konversation' });
  }
});

// ==================== MESSAGES ROUTES ====================

// Get messages for a conversation
app.get('/api/messages/:conversationId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const conversationId = parseInt(req.params.conversationId);
    
    // Verify user is part of conversation
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Konversation nicht gefunden' });
    }

    const participantIds = JSON.parse(conversation.participantIds);
    if (!participantIds.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const messages = await storage.getMessagesByConversationId(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create message
app.post('/api/messages', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { conversationId, content } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
    }

    // Verify user is part of conversation
    const conversation = await storage.getConversation(conversationId);
    if (!conversation) {
      return res.status(404).json({ error: 'Konversation nicht gefunden' });
    }

    const participantIds = JSON.parse(conversation.participantIds);
    if (!participantIds.includes(req.user.userId)) {
      return res.status(403).json({ error: 'Zugriff verweigert' });
    }

    const message = await storage.createMessage({
      conversationId,
      senderId: req.user.userId,
      content
    });

    // Update conversation's lastMessageAt
    await storage.updateConversation(conversationId, new Date());

    // Create notifications for other participants
    try {
      const sender = await storage.getUser(req.user.userId);
      const otherParticipantIds = participantIds.filter((id: number) => id !== req.user.userId);
      
      const notificationPromises = otherParticipantIds.map((userId: number) =>
        storage.createNotification({
          userId,
          message: `Neue Nachricht von ${sender?.name || 'Unbekannt'}`,
          type: 'info'
        })
      );
      
      await Promise.all(notificationPromises);
    } catch (notifError) {
      console.error('Error creating message notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Mark message as read
app.put('/api/messages/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    await storage.markMessageAsRead(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== CONTACTS ROUTES ====================

// Get all contacts
app.get('/api/contacts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const contacts = await storage.getAllContacts();
    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create contact (admin only)
app.post('/api/contacts', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const { name, role, phone, email } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name und Rolle sind Pflichtfelder' });
    }

    const contact = await storage.createContact({
      name,
      role,
      phone: phone || '',
      email: email || ''
    });

    res.status(201).json(contact);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Update contact (admin only)
app.put('/api/contacts/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const id = parseInt(req.params.id);
    const updates = req.body;

    const contact = await storage.updateContact(id, updates);
    if (!contact) {
      return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    }

    res.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete contact (admin only)
app.delete('/api/contacts/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const id = parseInt(req.params.id);
    const success = await storage.deleteContact(id);

    if (!success) {
      return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== NOTIFICATIONS ROUTES ====================

// Get all notifications for current user
app.get('/api/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const notifications = await storage.getAllNotifications(req.user.userId);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Create notification (admin only)
app.post('/api/notifications', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const { userId, message, type } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder: userId und message erforderlich' });
    }

    const notification = await storage.createNotification({
      userId,
      message,
      type: type || 'info',
      read: false
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    await storage.markNotificationAsRead(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Mark notification as unread
app.put('/api/notifications/:id/unread', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    await storage.markNotificationAsUnread(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as unread error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Delete notification
app.delete('/api/notifications/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const id = parseInt(req.params.id);
    const success = await storage.deleteNotification(id);

    if (!success) {
      return res.status(404).json({ error: 'Benachrichtigung nicht gefunden' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== SETTINGS ROUTES ====================

// Get setting by key (protected)
app.get('/api/settings/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const { key } = req.params;
    const setting = await storage.getSetting(key);

    if (!setting) {
      return res.status(404).json({ error: 'Setting nicht gefunden' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Update setting (admin only)
app.put('/api/settings/:key', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Zugriff verweigert: Nur Administratoren' });
    }

    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Fehlende Pflichtfelder: value erforderlich' });
    }

    const setting = await storage.updateSetting(key, value);
    res.json(setting);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== DAILY DEADLINE CHECK ====================

// Funktion zur Prüfung von Feriendienstfristen (1 Tag vor Ablauf)
async function checkHolidayDeadlines() {
  try {
    const periods = await storage.getAllHolidayPeriods();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    for (const period of periods) {
      // Prüfe ob die Deadline morgen ist
      if (period.deadline === tomorrowStr) {
        // Hole alle Eltern
        const parents = await storage.getAllParents();
        
        // Erstelle Benachrichtigungen für alle Eltern
        const notificationPromises = parents.map(parent =>
          storage.createNotification({
            userId: parent.id,
            message: `Erinnerung: Die Frist für "${period.name}" läuft morgen ab!`,
            type: 'alert'
          })
        );
        
        await Promise.all(notificationPromises);
        console.log(`📅 Frist-Erinnerungen für "${period.name}" versendet`);
      }
    }
  } catch (error) {
    console.error('Error checking holiday deadlines:', error);
  }
}

// Starte täglichen Check beim Server-Start
checkHolidayDeadlines();

// Wiederhole Check alle 24 Stunden (86400000 ms)
setInterval(checkHolidayDeadlines, 24 * 60 * 60 * 1000);

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Backend Server läuft auf Port ${PORT}`);
  console.log(`📍 API erreichbar unter http://localhost:${PORT}/api`);
});

export default app;
