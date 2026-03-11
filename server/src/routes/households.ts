import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import db from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

function generateCode(): string {
  return crypto.randomBytes(5).toString('hex');
}

function getHouseholdWithMembers(householdId: number) {
  const household = db
    .prepare('SELECT id, name, invite_code, created_at FROM households WHERE id = ?')
    .get(householdId) as { id: number; name: string; invite_code: string; created_at: string } | undefined;
  if (!household) return null;

  const members = db
    .prepare(`
      SELECT u.id, u.name, u.email, hm.joined_at
      FROM household_members hm
      JOIN users u ON u.id = hm.user_id
      WHERE hm.household_id = ?
      ORDER BY hm.joined_at
    `)
    .all(householdId);

  return { ...household, members };
}

// POST /api/households  — create a new household
router.post('/', (req: Request, res: Response) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'Household name is required' });

  const existing = db.prepare('SELECT household_id FROM household_members WHERE user_id = ?').get(req.userId);
  if (existing) return res.status(409).json({ error: 'You already belong to a household' });

  const householdId = db.transaction(() => {
    const result = db
      .prepare('INSERT INTO households (name, invite_code) VALUES (?, ?)')
      .run(name.trim(), generateCode());
    const id = result.lastInsertRowid as number;
    db.prepare('INSERT INTO household_members (household_id, user_id) VALUES (?, ?)').run(id, req.userId);

    const insertDish = db.prepare(
      'INSERT INTO dishes (household_id, name, category) VALUES (?, ?, ?)'
    );
    insertDish.run(id, 'Broccoli', 'Starter');
    insertDish.run(id, 'Steak', 'Main');
    insertDish.run(id, 'Corn and Fries', 'Main');
    insertDish.run(id, 'Tiramisu', 'Dessert');

    return id;
  })();

  res.status(201).json(getHouseholdWithMembers(householdId));
});

// GET /api/households/me
router.get('/me', (req: Request, res: Response) => {
  if (!req.householdId) return res.status(404).json({ error: 'Not in any household' });
  res.json(getHouseholdWithMembers(req.householdId));
});

// POST /api/households/join
router.post('/join', (req: Request, res: Response) => {
  const { invite_code } = req.body as { invite_code?: string };
  if (!invite_code?.trim()) return res.status(400).json({ error: 'invite_code is required' });

  if (req.householdId) return res.status(409).json({ error: 'You already belong to a household' });

  const household = db
    .prepare('SELECT id FROM households WHERE invite_code = ?')
    .get(invite_code.trim().toLowerCase()) as { id: number } | undefined;
  if (!household) return res.status(404).json({ error: 'Invalid invite code' });

  db.prepare('INSERT INTO household_members (household_id, user_id) VALUES (?, ?)').run(household.id, req.userId);
  res.json(getHouseholdWithMembers(household.id));
});

// POST /api/households/regenerate-code
router.post('/regenerate-code', (req: Request, res: Response) => {
  if (!req.householdId) return res.status(404).json({ error: 'Not in any household' });
  const newCode = generateCode();
  db.prepare('UPDATE households SET invite_code = ? WHERE id = ?').run(newCode, req.householdId);
  res.json({ invite_code: newCode });
});

// POST /api/households/leave
router.post('/leave', (req: Request, res: Response) => {
  if (!req.householdId) return res.status(404).json({ error: 'Not in any household' });
  db.prepare('DELETE FROM household_members WHERE user_id = ? AND household_id = ?').run(req.userId, req.householdId);
  res.json({ success: true });
});

export default router;
