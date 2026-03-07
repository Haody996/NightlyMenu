import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

interface FeedDish {
  id: number;
  name: string;
  description: string;
  category: string;
  servings: number;
  image: string | null;
  created_at: string;
  household_name: string;
}

// GET /api/feed?cursor=<id>&limit=20
router.get('/', (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor ? Number(req.query.cursor) : null;

  const rows = (
    cursor
      ? db.prepare(`
          SELECT d.id, d.name, d.description, d.category, d.servings, d.image, d.created_at,
                 h.name as household_name
          FROM dishes d
          JOIN households h ON h.id = d.household_id
          WHERE d.household_id IS NOT NULL AND d.id < ?
          ORDER BY d.id DESC
          LIMIT ?
        `).all(cursor, limit + 1)
      : db.prepare(`
          SELECT d.id, d.name, d.description, d.category, d.servings, d.image, d.created_at,
                 h.name as household_name
          FROM dishes d
          JOIN households h ON h.id = d.household_id
          WHERE d.household_id IS NOT NULL
          ORDER BY d.id DESC
          LIMIT ?
        `).all(limit + 1)
  ) as FeedDish[];

  const hasMore = rows.length > limit;
  if (hasMore) rows.pop();

  const dishes = rows.map((d) => {
    const ingredients = db
      .prepare('SELECT name, quantity, unit FROM ingredients WHERE dish_id = ? ORDER BY id LIMIT 10')
      .all(d.id);
    return { ...d, ingredients };
  });

  res.json({
    dishes,
    nextCursor: hasMore ? dishes[dishes.length - 1].id : null,
  });
});

export default router;
