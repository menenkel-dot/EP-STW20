import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

// Sicherheit: JWT_SECRET muss gesetzt sein
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('❌ FEHLER: JWT_SECRET Umgebungsvariable ist nicht gesetzt!');
  console.error('   Bitte setzen Sie JWT_SECRET in der .env Datei oder als Umgebungsvariable.');
  console.error('   Beispiel: JWT_SECRET=ihr-geheimer-schlüssel-mindestens-32-zeichen-lang');
  process.exit(1);
}

const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
}

// JWT Token generieren
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Refresh Token generieren
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

// Token verifizieren
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Passwort hashen
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Passwort vergleichen
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Middleware zur Token-Verifizierung
export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Kein Token vorhanden' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(403).json({ error: 'Ungültiger oder abgelaufener Token' });
  }

  req.user = payload;
  next();
}

// Middleware zur Rollen-Überprüfung
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Nicht authentifiziert' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Keine Berechtigung' });
    }

    next();
  };
}
