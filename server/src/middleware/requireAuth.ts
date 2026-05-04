import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token;
  if (!token) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};
