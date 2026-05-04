import jwt from 'jsonwebtoken';
import type { Request, Response } from 'express';
import User from '../models/User.js';
import { signupSchema, loginSchema } from '../types/auth.js';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (userId: string) =>
  jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });

export const signup = async (req: Request, res: Response) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: result.error.issues });
    return;
  }
  const { name, email, password } = result.data;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(409).json({ success: false, error: 'Email already in use' });
    return;
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id.toString());
  res.cookie('auth_token', token, COOKIE_OPTS);
  res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email } });
};

export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ success: false, error: 'Validation failed', details: result.error.issues });
    return;
  }
  const { email, password } = result.data;

  const user = await User.findOne({ email }).select('+password');
  const valid = user && await (user as any).comparePassword(password);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
    return;
  }

  const token = signToken(user._id.toString());
  res.cookie('auth_token', token, COOKIE_OPTS);
  res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email } });
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ success: true });
};

export const me = async (req: Request, res: Response) => {
  const user = await User.findById(req.userId);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  res.json({ success: true, data: { _id: user._id, name: user.name, email: user.email } });
};
