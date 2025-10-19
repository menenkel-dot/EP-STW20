import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { storage } from './storage.js';
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
app.use(express.json());

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

// Register (nur für Entwicklung/Testing - in Produktion sollte dies admin-only sein)
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Benutzername, Passwort und Name erforderlich' });
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
      avatarUrl: null
    });

    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl
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
      children: children
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== CHILDREN ROUTES ====================

// Get children for current user
app.get('/api/children', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const children = await storage.getChildrenByParentId(req.user.userId);
    res.json(children);
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ error: 'Serverfehler' });
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

// Get documents for current user
app.get('/api/documents', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    const documents = await storage.getDocumentsByUserId(req.user.userId);
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// ==================== ABSENCES ROUTES ====================

// Get absences for a child
app.get('/api/absences/:childId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const childId = parseInt(req.params.childId);
    const absences = await storage.getAbsencesByChildId(childId);
    res.json(absences);
  } catch (error) {
    console.error('Get absences error:', error);
    res.status(500).json({ error: 'Serverfehler' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✅ Backend Server läuft auf Port ${PORT}`);
  console.log(`📍 API erreichbar unter http://localhost:${PORT}/api`);
});

export default app;
