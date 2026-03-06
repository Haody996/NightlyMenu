import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { requireAuth, signToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body as {
    name?: string; email?: string; password?: string;
  };

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim());
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
    .run(name.trim(), email.trim().toLowerCase(), hash);

  const user = db
    .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
    .get(result.lastInsertRowid) as { id: number; name: string; email: string; created_at: string };

  res.status(201).json({ token: signToken(user.id), user });
});

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = db
    .prepare('SELECT id, name, email, password, created_at FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as
    | { id: number; name: string; email: string; password: string; created_at: string }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { password: _pw, ...safeUser } = user;
  res.json({ token: signToken(user.id), user: safeUser });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = db
    .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
    .get(req.userId) as { id: number; name: string; email: string; created_at: string } | undefined;

  if (!user) return res.status(404).json({ error: 'User not found' });

  const household = req.householdId
    ? db.prepare('SELECT id, name, invite_code, created_at FROM households WHERE id = ?').get(req.householdId)
    : null;

  res.json({ user, household });
});

export default router;

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response) => {
  const { credential } = req.body as { credential?: string };
  if (!credential) return res.status(400).json({ error: 'credential is required' });

  const { OAuth2Client } = await import('google-auth-library');
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  let payload: { sub: string; email: string; name: string } | undefined;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    if (!p?.sub || !p.email) throw new Error('Invalid token payload');
    payload = { sub: p.sub, email: p.email, name: p.name ?? p.email };
  } catch {
    return res.status(401).json({ error: 'Invalid Google credential' });
  }

  type UserRow = { id: number; name: string; email: string; created_at: string };

  // Find by google_id first
  let user = db
    .prepare('SELECT id, name, email, created_at FROM users WHERE google_id = ?')
    .get(payload.sub) as UserRow | undefined;

  if (!user) {
    // Find by email — link existing account
    const byEmail = db
      .prepare('SELECT id, name, email, created_at FROM users WHERE email = ?')
      .get(payload.email.toLowerCase()) as UserRow | undefined;

    if (byEmail) {
      db.prepare('UPDATE users SET google_id = ? WHERE id = ?').run(payload.sub, byEmail.id);
      user = byEmail;
    } else {
      // Create new user (random password — Google users won't use it)
      const { randomBytes } = await import('crypto');
      const randomPw = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);
      const result = db
        .prepare('INSERT INTO users (name, email, password, google_id) VALUES (?, ?, ?, ?)')
        .run(payload.name, payload.email.toLowerCase(), randomPw, payload.sub);
      user = db
        .prepare('SELECT id, name, email, created_at FROM users WHERE id = ?')
        .get(result.lastInsertRowid) as UserRow;
    }
  }

  res.json({ token: signToken(user.id), user });
});
