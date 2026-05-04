import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request, Response, NextFunction } from 'express';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  next();
};
