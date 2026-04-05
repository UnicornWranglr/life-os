import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { db, pool } from './db';
import { errorHandler } from './middleware/errorHandler';

import authRouter         from './routes/auth';
import visionRouter       from './routes/vision';
import areasRouter        from './routes/areas';
import rocksRouter        from './routes/rocks';
import intentionsRouter   from './routes/intentions';
import sessionsRouter     from './routes/sessions';
import dailyLogsRouter    from './routes/dailyLogs';
import habitsRouter       from './routes/habits';
import lifeTasksRouter    from './routes/lifeTasks';
import weeklyReviewsRouter from './routes/weeklyReviews';
import projectItemsRouter from './routes/projectItems';
import insightsRouter     from './routes/insights';
import chatRouter         from './routes/chat';

const app  = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
}));
app.use(express.json());

// ── Health check (no auth required — used by Render uptime checks) ─────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',          authRouter);
app.use('/api/vision',        visionRouter);
app.use('/api/areas',         areasRouter);
app.use('/api/rocks',         rocksRouter);
app.use('/api/intentions',    intentionsRouter);
app.use('/api/sessions',      sessionsRouter);
app.use('/api/daily-logs',    dailyLogsRouter);
app.use('/api/habits',        habitsRouter);
app.use('/api/life-tasks',    lifeTasksRouter);
app.use('/api/reviews',       weeklyReviewsRouter);
app.use('/api/project-items', projectItemsRouter);
app.use('/api/insights',      insightsRouter);
app.use('/api/chat',          chatRouter);

// ── Error handler (must be last) ───────────────────────────────────────────
app.use(errorHandler);

// ── Startup ────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Run any pending migrations before accepting traffic.
    // Migration files live in lifeos-backend/drizzle/migrations/ and are
    // committed to the repo, so they're present on Render at runtime.
    // __dirname resolves to dist/ in production and src/ under tsx in dev;
    // either way, ../drizzle/migrations is the correct relative path.
    await migrate(db, {
      migrationsFolder: path.join(__dirname, '../drizzle/migrations'),
    });
    console.log('Migrations applied');

    app.listen(PORT, () => {
      console.log(`Life OS API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    await pool.end();
    process.exit(1);
  }
}

start();
