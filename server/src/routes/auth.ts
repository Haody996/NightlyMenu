import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import db from '../db';
import { requireAuth, signToken } from '../middleware/auth';

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

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

// POST /api/auth/send-code
router.post('/send-code', async (req: Request, res: Response) => {
  const { email } = req.body as { email?: string };
  if (!email?.trim()) return res.status(400).json({ error: 'email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Delete old codes for this email, store new one
  db.prepare('DELETE FROM email_codes WHERE email = ?').run(normalizedEmail);
  db.prepare('INSERT INTO email_codes (email, code, expires_at) VALUES (?, ?, ?)').run(normalizedEmail, code, expiresAt);

  const isNew = !db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);

  try {
    const transporter = makeTransport();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
      to: normalizedEmail,
      subject: 'Your Dinnerly sign-in code',
      text: `Your sign-in code is: ${code}\n\nThis code expires in 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto">
          <h2 style="color:#b45309">Your Dinnerly sign-in code</h2>
          <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1f2937">${code}</p>
          <p style="color:#6b7280;font-size:14px">This code expires in 10 minutes. If you didn't request this, you can ignore it.</p>
        </div>`,
    });
  } catch (e) {
    console.error('Email send error:', e);
    return res.status(500).json({ error: 'Failed to send code' });
  }

  res.json({ isNew });
});

// POST /api/auth/verify-code
router.post('/verify-code', async (req: Request, res: Response) => {
  const { email, code, name } = req.body as { email?: string; code?: string; name?: string };
  if (!email?.trim() || !code?.trim()) return res.status(400).json({ error: 'email and code are required' });

  const normalizedEmail = email.trim().toLowerCase();

  type CodeRow = { id: number; code: string; expires_at: number; used: number };
  const row = db
    .prepare('SELECT id, code, expires_at, used FROM email_codes WHERE email = ? ORDER BY id DESC LIMIT 1')
    .get(normalizedEmail) as CodeRow | undefined;

  if (!row || row.used || row.code !== code.trim() || Date.now() > row.expires_at) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }

  db.prepare('UPDATE email_codes SET used = 1 WHERE id = ?').run(row.id);

  type UserRow = { id: number; name: string; email: string; created_at: string };
  let user = db.prepare('SELECT id, name, email, created_at FROM users WHERE email = ?').get(normalizedEmail) as UserRow | undefined;

  if (!user) {
    const displayName = name?.trim() || normalizedEmail.split('@')[0];
    const { randomBytes } = await import('crypto');
    const randomPw = bcrypt.hashSync(randomBytes(32).toString('hex'), 10);
    const result = db
      .prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)')
      .run(displayName, normalizedEmail, randomPw);
    user = db.prepare('SELECT id, name, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid) as UserRow;
  }

  res.json({ token: signToken(user.id), user });
});
