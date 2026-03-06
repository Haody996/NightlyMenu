import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

interface JwtPayload {
  userId: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  const row = db
    .prepare('SELECT household_id FROM household_members WHERE user_id = ?')
    .get(req.userId) as { household_id: number } | undefined;

  req.householdId = row?.household_id ?? 0;
  next();
}

export function requireHousehold(req: Request, res: Response, next: NextFunction): void {
  if (!req.householdId) {
    res.status(403).json({ error: 'You must belong to a household to do this' });
    return;
  }
  next();
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}
