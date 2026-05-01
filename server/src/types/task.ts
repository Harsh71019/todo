import { z } from 'zod';

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const TaskStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

export type TaskPriorityType = (typeof TaskPriority)[keyof typeof TaskPriority];
export type TaskStatusType = (typeof TaskStatus)[keyof typeof TaskStatus];

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriorityType;
  status: TaskStatusType;
  tags: string[];
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

// Zod schemas for validation
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string().min(1).max(30)).max(5, 'Max 5 tags').default([]),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'completed']).optional(),
  tags: z.array(z.string().min(1).max(30)).max(5).optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
