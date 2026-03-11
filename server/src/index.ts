import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import householdsRouter from './routes/households';
import dishesRouter from './routes/dishes';
import mealPlanRouter from './routes/mealPlan';
import feedRouter from './routes/feed';

const app = express();
const PORT = process.env.PORT || 3002;

const allowedOrigins = (process.env.CLIENT_URL ?? 'http://localhost:5174').split(',').map(s => s.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/households', householdsRouter);
app.use('/api/dishes', dishesRouter);
app.use('/api/meal-plan', mealPlanRouter);
app.use('/api/feed', feedRouter);

const DEMO_HOUSEHOLD_ID = parseInt(process.env.DEMO_HOUSEHOLD_ID ?? '1', 10);

app.get('/api/demo', (_req, res) => {
  const db = require('./db').default;
  const rawDishes = db.prepare('SELECT * FROM dishes WHERE household_id = ? ORDER BY created_at DESC').all(DEMO_HOUSEHOLD_ID) as { id: number }[];
  const getIngredients = db.prepare('SELECT * FROM ingredients WHERE dish_id = ?');
  const dishes = rawDishes.map((d) => ({ ...d, ingredients: getIngredients.all(d.id) }));
  const tonightRows = db.prepare('SELECT dish_id FROM meal_plan WHERE household_id = ?').all(DEMO_HOUSEHOLD_ID) as { dish_id: number }[];
  const tonight_ids = tonightRows.map((r) => r.dish_id);
  res.json({ dishes, tonight_ids });
});

app.listen(PORT, () => {
  console.log(`Meal Planner server running on http://localhost:${PORT}`);
});
