import { z } from 'zod';

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(30, 'Tag name too long')
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, 'Tag name can only contain letters, numbers, hyphens and underscores'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color like #3b82f6')
    .default('#6366f1'),
  isDefault: z.boolean().default(false),
  description: z.string().max(100, 'Description too long').optional(),
});

export const updateTagSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(30)
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
  isDefault: z.boolean().optional(),
  description: z.string().max(100).optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
