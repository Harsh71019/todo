import { z } from 'zod';

export const startSessionSchema = z.object({
  taskId: z.string().min(1),
});

export const stopSessionSchema = z.object({
  status: z.enum(['completed', 'abandoned']),
});

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type StopSessionInput = z.infer<typeof stopSessionSchema>;
