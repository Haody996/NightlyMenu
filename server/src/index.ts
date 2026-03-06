import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import householdsRouter from './routes/households';
import dishesRouter from './routes/dishes';
import mealPlanRouter from './routes/mealPlan';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({ origin: 'http://localhost:5174' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/households', householdsRouter);
app.use('/api/dishes', dishesRouter);
app.use('/api/meal-plan', mealPlanRouter);

app.listen(PORT, () => {
  console.log(`Meal Planner server running on http://localhost:${PORT}`);
});
