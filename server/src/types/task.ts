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

export interface ISubtask {
  _id?: string;
  title: string;
  isCompleted: boolean;
}

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriorityType;
  status: TaskStatusType;
  tags: string[];
  estimatedMinutes: number;
  subtasks: ISubtask[];
  isLongTerm: boolean;
  isDeleted: boolean;
  isArchived?: boolean;
  dueDate?: Date;
  createdAt: Date;
  completedAt?: Date;
  deletedAt?: Date;
  updatedAt: Date;
  totalFocusSeconds: number;
  completedPomodoros: number;
  lastFocusedAt?: Date;
}

export const subtaskSchema = z.object({
  title: z.string().min(1).max(200),
  isCompleted: z.boolean().default(false),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string().min(1).max(30)).max(5, 'Max 5 tags').default([]),
  estimatedMinutes: z.number().min(0).max(1440).default(0),
  subtasks: z.array(subtaskSchema).max(20).default([]),
  isLongTerm: z.boolean().default(false),
  dueDate: z.string().datetime().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'completed']).optional(),
  tags: z.array(z.string().min(1).max(30)).max(5).optional(),
  estimatedMinutes: z.number().min(0).max(1440).optional(),
  subtasks: z
    .array(
      z.object({
        _id: z.string().optional(),
        title: z.string().min(1).max(200),
        isCompleted: z.boolean(),
      }),
    )
    .max(20)
    .optional(),
  isLongTerm: z.boolean().optional(),
  isDeleted: z.boolean().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
