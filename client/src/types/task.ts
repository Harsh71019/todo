export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  tags?: string[];
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  dueDate?: string | null;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: string;
}

// Stats types
export interface StatsOverview {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  createdThisWeek: number;
  completedThisWeek: number;
  overdueTasks: number;
  completionRate: number;
  avgTimeToCompleteHours: number;
}

export interface WeeklyActivity {
  date: string;
  day: string;
  created: number;
  completed: number;
}

export interface MonthlyTrend {
  week: string;
  startDate: string;
  created: number;
  completed: number;
}

export interface PriorityBreakdown {
  priority: string;
  total: number;
  completed: number;
  pending: number;
}

export interface TagBreakdown {
  tag: string;
  total: number;
  completed: number;
  pending: number;
}
