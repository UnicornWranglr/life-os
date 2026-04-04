import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions,
    );

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'token is required' });
      return;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const [user] = await db.select().from(users).where(eq(users.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const newToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' } as jwt.SignOptions,
    );

    res.json({ token: newToken });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [user] = await db
      .select({ id: users.id, email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, req.userId!));

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
