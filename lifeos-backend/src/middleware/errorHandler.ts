import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  console.error(err);

  if (err instanceof Error) {
    // Drizzle / pg constraint violations surface here
    const msg = err.message;
    if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
      res.status(409).json({ error: 'Resource already exists' });
      return;
    }
    if (msg.includes('foreign key')) {
      res.status(400).json({ error: 'Invalid reference: related resource not found' });
      return;
    }
  }

  res.status(500).json({ error: 'Internal server error' });
}
