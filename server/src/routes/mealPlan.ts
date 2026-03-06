import { Router, Request, Response } from 'express';
import db from '../db';
import { requireAuth, requireHousehold } from '../middleware/auth';
import { sendMealNotification } from '../lib/mailer';

const router = Router();
router.use(requireAuth, requireHousehold);

function todayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// GET /api/meal-plan/tonight
router.get('/tonight', (req: Request, res: Response) => {
  const date = todayDate();
  const rows = db
    .prepare(
      `SELECT d.*, mp.id as plan_id
       FROM meal_plan mp
       JOIN dishes d ON d.id = mp.dish_id
       WHERE mp.date = ? AND mp.household_id = ?
       ORDER BY mp.id`
    )
    .all(date, req.householdId) as Array<{
      id: number; name: string; description: string; category: string;
      servings: number; created_at: string; plan_id: number;
    }>;

  const dishes = rows.map((d) => {
    const ingredients = db.prepare('SELECT * FROM ingredients WHERE dish_id = ? ORDER BY id').all(d.id);
    return { ...d, ingredients };
  });

  res.json({ date, dishes });
});

// POST /api/meal-plan/tonight/notify
router.post('/tonight/notify', async (req: Request, res: Response) => {
  const date = todayDate();

  const rows = db
    .prepare(`SELECT d.name FROM meal_plan mp JOIN dishes d ON d.id = mp.dish_id WHERE mp.date = ? AND mp.household_id = ? ORDER BY mp.id`)
    .all(date, req.householdId) as { name: string }[];

  if (rows.length === 0) return res.status(400).json({ error: 'No dishes planned for tonight' });

  const sender = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId) as { name: string } | undefined;
  const household = db.prepare('SELECT name FROM households WHERE id = ?').get(req.householdId) as { name: string } | undefined;
  const members = db
    .prepare(`SELECT u.email FROM household_members hm JOIN users u ON u.id = hm.user_id WHERE hm.household_id = ?`)
    .all(req.householdId) as { email: string }[];

  if (!sender || !household) return res.status(500).json({ error: 'Could not load household data' });

  await sendMealNotification({
    to: members.map((m) => m.email),
    senderName: sender.name,
    dishes: rows.map((r) => r.name),
    householdName: household.name,
  });

  res.json({ success: true });
});

// POST /api/meal-plan/tonight/:dishId
router.post('/tonight/:dishId', (req: Request, res: Response) => {
  const dishId = Number(req.params.dishId);
  const date = todayDate();

  const dish = db.prepare('SELECT id, name FROM dishes WHERE id = ? AND household_id = ?').get(dishId, req.householdId) as { id: number; name: string } | undefined;
  if (!dish) return res.status(404).json({ error: 'Dish not found' });

  try {
    db.prepare('INSERT INTO meal_plan (household_id, date, dish_id) VALUES (?, ?, ?)').run(req.householdId, date, dishId);
  } catch {
    // Already in plan (UNIQUE constraint)
  }

  res.json({ success: true });
});

// DELETE /api/meal-plan/tonight/:dishId
router.delete('/tonight/:dishId', (req: Request, res: Response) => {
  const dishId = Number(req.params.dishId);
  const date = todayDate();
  db.prepare('DELETE FROM meal_plan WHERE date = ? AND dish_id = ? AND household_id = ?').run(date, dishId, req.householdId);
  res.json({ success: true });
});

export default router;
