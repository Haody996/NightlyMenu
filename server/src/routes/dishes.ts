import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import crypto from 'crypto';
import db from '../db';
import { requireAuth, requireHousehold } from '../middleware/auth';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const router = Router();
router.use(requireAuth, requireHousehold);

interface Ingredient {
  id?: number;
  name: string;
  quantity: string;
  unit: string;
}

interface DishRow {
  id: number;
  household_id: number;
  name: string;
  description: string;
  category: string;
  servings: number;
  created_at: string;
  image: string | null;
}

function getDishWithIngredients(id: number, householdId: number) {
  const dish = db
    .prepare('SELECT * FROM dishes WHERE id = ? AND household_id = ?')
    .get(id, householdId) as DishRow | undefined;
  if (!dish) return null;
  const ingredients = db.prepare('SELECT * FROM ingredients WHERE dish_id = ? ORDER BY id').all(id);
  return { ...dish, ingredients };
}

// GET /api/dishes
router.get('/', (req: Request, res: Response) => {
  const dishes = db
    .prepare('SELECT * FROM dishes WHERE household_id = ? ORDER BY created_at DESC')
    .all(req.householdId) as DishRow[];
  const result = dishes.map((d) => {
    const ingredients = db.prepare('SELECT * FROM ingredients WHERE dish_id = ? ORDER BY id').all(d.id);
    return { ...d, ingredients };
  });
  res.json(result);
});

// GET /api/dishes/:id
router.get('/:id', (req: Request, res: Response) => {
  const dish = getDishWithIngredients(Number(req.params.id), req.householdId);
  if (!dish) return res.status(404).json({ error: 'Dish not found' });
  res.json(dish);
});

// POST /api/dishes
router.post('/', (req: Request, res: Response) => {
  const { name, description = '', category = 'Main', servings = 2, ingredients = [] } = req.body as {
    name: string;
    description?: string;
    category?: string;
    servings?: number;
    ingredients?: Ingredient[];
  };

  if (!name?.trim()) return res.status(400).json({ error: 'Dish name is required' });

  const insertDish = db.prepare(
    'INSERT INTO dishes (household_id, name, description, category, servings) VALUES (?, ?, ?, ?, ?)'
  );
  const insertIngredient = db.prepare(
    'INSERT INTO ingredients (dish_id, name, quantity, unit) VALUES (?, ?, ?, ?)'
  );

  const dishId = db.transaction(() => {
    const result = insertDish.run(req.householdId, name.trim(), description, category, servings);
    const id = result.lastInsertRowid as number;
    for (const ing of ingredients) {
      if (ing.name?.trim()) insertIngredient.run(id, ing.name.trim(), ing.quantity || '', ing.unit || '');
    }
    return id;
  })();

  res.status(201).json(getDishWithIngredients(dishId, req.householdId));
});

// PUT /api/dishes/:id
router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description = '', category = 'Main', servings = 2, ingredients = [] } = req.body as {
    name: string;
    description?: string;
    category?: string;
    servings?: number;
    ingredients?: Ingredient[];
  };

  if (!name?.trim()) return res.status(400).json({ error: 'Dish name is required' });

  const existing = db.prepare('SELECT id FROM dishes WHERE id = ? AND household_id = ?').get(id, req.householdId);
  if (!existing) return res.status(404).json({ error: 'Dish not found' });

  db.transaction(() => {
    db.prepare('UPDATE dishes SET name = ?, description = ?, category = ?, servings = ? WHERE id = ?')
      .run(name.trim(), description, category, servings, id);
    db.prepare('DELETE FROM ingredients WHERE dish_id = ?').run(id);
    for (const ing of ingredients) {
      if (ing.name?.trim()) {
        db.prepare('INSERT INTO ingredients (dish_id, name, quantity, unit) VALUES (?, ?, ?, ?)')
          .run(id, ing.name.trim(), ing.quantity || '', ing.unit || '');
      }
    }
  })();

  res.json(getDishWithIngredients(id, req.householdId));
});

// DELETE /api/dishes/:id
router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dish = db.prepare('SELECT image FROM dishes WHERE id = ? AND household_id = ?').get(id, req.householdId) as { image: string | null } | undefined;
  if (!dish) return res.status(404).json({ error: 'Dish not found' });
  if (dish.image) fs.unlink(path.join(UPLOADS_DIR, dish.image), () => {});
  db.prepare('DELETE FROM dishes WHERE id = ?').run(id);
  res.json({ success: true });
});

// POST /api/dishes/:id/image
router.post('/:id/image', upload.single('image'), (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  const dish = db.prepare('SELECT image FROM dishes WHERE id = ? AND household_id = ?').get(id, req.householdId) as { image: string | null } | undefined;
  if (!dish) {
    fs.unlink(req.file.path, () => {});
    return res.status(404).json({ error: 'Dish not found' });
  }

  if (dish.image) fs.unlink(path.join(UPLOADS_DIR, dish.image), () => {});
  db.prepare('UPDATE dishes SET image = ? WHERE id = ?').run(req.file.filename, id);
  res.json({ image: req.file.filename });
});

// DELETE /api/dishes/:id/image
router.delete('/:id/image', (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const dish = db.prepare('SELECT image FROM dishes WHERE id = ? AND household_id = ?').get(id, req.householdId) as { image: string | null } | undefined;
  if (!dish) return res.status(404).json({ error: 'Dish not found' });
  if (dish.image) {
    fs.unlink(path.join(UPLOADS_DIR, dish.image), () => {});
    db.prepare('UPDATE dishes SET image = NULL WHERE id = ?').run(id);
  }
  res.json({ success: true });
});

export default router;
