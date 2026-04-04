import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { quarterlyRocks } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/rocks?quarter=2026-Q2
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { quarter } = req.query;

    const conditions = [eq(quarterlyRocks.userId, req.userId!)];
    if (quarter) conditions.push(eq(quarterlyRocks.quarter, quarter as string));

    const result = await db.select().from(quarterlyRocks).where(and(...conditions));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/rocks
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { areaId, quarter, title } = req.body;
    if (!areaId || !quarter || !title) {
      res.status(400).json({ error: 'areaId, quarter, and title are required' });
      return;
    }

    const [created] = await db
      .insert(quarterlyRocks)
      .values({ userId: req.userId!, areaId, quarter, title })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/rocks/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { title, status, notes } = req.body;

    const [updated] = await db
      .update(quarterlyRocks)
      .set({ title, status, notes })
      .where(and(eq(quarterlyRocks.id, req.params.id), eq(quarterlyRocks.userId, req.userId!)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Rock not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/rocks/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [deleted] = await db
      .delete(quarterlyRocks)
      .where(and(eq(quarterlyRocks.id, req.params.id), eq(quarterlyRocks.userId, req.userId!)))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Rock not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
