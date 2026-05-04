import { z } from 'zod';

export const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'INR', 'EUR', 'GBP']).default('INR'),
  billingCycle: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.coerce.date().default(() => new Date()),
  nextBillingDate: z.coerce.date(),
  category: z.string().min(1, 'Category is required').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format'),
  url: z.string().url().optional().or(z.literal('')),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;

export interface SubscriptionResponse extends SubscriptionInput {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
