import { Router } from 'express';
import { and, eq, count } from 'drizzle-orm';
import { db } from '../db';
import { projectItems } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// GET /api/project-items?areaId=
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const { areaId } = req.query;

    const conditions = [eq(projectItems.userId, req.userId!)];
    if (areaId) conditions.push(eq(projectItems.areaId, areaId as string));

    const result = await db
      .select()
      .from(projectItems)
      .where(and(...conditions));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/project-items
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const { areaId, title, type, notes, status } = req.body;
    if (!areaId || !title) {
      res.status(400).json({ error: 'areaId and title are required' });
      return;
    }

    // Enforce WIP cap of 3 for in_progress items per area
    const targetStatus = status ?? 'next';
    if (targetStatus === 'in_progress') {
      const [{ value: inProgressCount }] = await db
        .select({ value: count() })
        .from(projectItems)
        .where(and(
          eq(projectItems.userId, req.userId!),
          eq(projectItems.areaId, areaId),
          eq(projectItems.status, 'in_progress'),
        ));

      if (Number(inProgressCount) >= 3) {
        res.status(422).json({
          error: 'WIP limit reached: maximum 3 in-progress items per area.',
        });
        return;
      }
    }

    const [created] = await db
      .insert(projectItems)
      .values({ userId: req.userId!, areaId, title, type, notes, status: targetStatus })
      .returning();

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// PUT /api/project-items/:id
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const { title, status, type, notes } = req.body;

    // Enforce WIP cap when moving an item to in_progress
    if (status === 'in_progress') {
      const [existing] = await db
        .select()
        .from(projectItems)
        .where(and(
          eq(projectItems.id, req.params.id),
          eq(projectItems.userId, req.userId!),
        ));

      if (existing && existing.status !== 'in_progress') {
        const [{ value: inProgressCount }] = await db
          .select({ value: count() })
          .from(projectItems)
          .where(and(
            eq(projectItems.userId, req.userId!),
            eq(projectItems.areaId, existing.areaId),
            eq(projectItems.status, 'in_progress'),
          ));

        if (Number(inProgressCount) >= 3) {
          res.status(422).json({
            error: 'WIP limit reached: maximum 3 in-progress items per area.',
          });
          return;
        }
      }
    }

    const completedAt = status === 'done' ? new Date() : undefined;

    const [updated] = await db
      .update(projectItems)
      .set({ title, status, type, notes, ...(completedAt ? { completedAt } : {}) })
      .where(and(
        eq(projectItems.id, req.params.id),
        eq(projectItems.userId, req.userId!),
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Project item not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/project-items/:id
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const [deleted] = await db
      .delete(projectItems)
      .where(and(
        eq(projectItems.id, req.params.id),
        eq(projectItems.userId, req.userId!),
      ))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: 'Project item not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
