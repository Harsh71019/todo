import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
