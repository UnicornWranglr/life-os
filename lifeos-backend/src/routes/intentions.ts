import { Router } from 'express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { monthlyIntentions } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/intentions?month=2026-04
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { month } = req.query;

    const conditions = [eq(monthlyIntentions.userId, req.userId!)];
    if (month) conditions.push(eq(monthlyIntentions.month, month as string));

    const result = await db.select().from(monthlyIntentions).where(and(...conditions));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/intentions
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { areaId, month, title } = req.body;
    if (!areaId || !month || !title) {
      res.status(400).json({ error: 'areaId, month, and title are required' });
      return;
    }

    const [created] = await db
      .insert(monthlyIntentions)
      .values({ userId: req.userId!, areaId, month, title })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/intentions/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { title, status } = req.body;

    const [updated] = await db
      .update(monthlyIntentions)
      .set({ title, status })
      .where(and(
        eq(monthlyIntentions.id, req.params.id),
        eq(monthlyIntentions.userId, req.userId!),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Intention not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/intentions/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [deleted] = await db
      .delete(monthlyIntentions)
      .where(and(
        eq(monthlyIntentions.id, req.params.id),
        eq(monthlyIntentions.userId, req.userId!),
      ))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Intention not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
