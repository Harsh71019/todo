export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'completed';

export interface Subtask {
  _id?: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  tags: string[];
  estimatedMinutes: number;
  subtasks: Subtask[];
  isLongTerm: boolean;
  isDeleted: boolean;
  isArchived: boolean;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  deletedAt?: string;
  updatedAt: string;
  totalFocusSeconds: number;
  completedPomodoros: number;
  lastFocusedAt?: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: TaskPriority;
  tags?: string[];
  estimatedMinutes?: number;
  subtasks?: { title: string; isCompleted: boolean }[];
  isLongTerm?: boolean;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  estimatedMinutes?: number;
  subtasks?: Subtask[];
  isLongTerm?: boolean;
  isDeleted?: boolean;
  isArchived?: boolean;
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
  createdToday: number;
  completedToday: number;
  completionRate: number;
  avgTimeToCompleteHours: number;
  avgCompletedPerDay: number;
  estimatedVsActualRatio: number;
  trashCount: number;
  activeLongTermTasks: number;
  currentStreak: number;
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

export interface DayOfWeekStats {
  day: string;
  completed: number;
}

export interface VelocityStats {
  priority: string;
  fastestHours: number | null;
  longestHours: number | null;
  avgHours: number | null;
}

export interface HeatmapData {
  date: string;
  count: number;
}

export interface TimeOfDayStats {
  bucket: string;
  count: number;
}

export interface FocusDriftStats {
  title: string;
  estimated: number;
  actual: number;
}

export interface TagEfficiencyStats {
  tag: string;
  avgHours: number;
  count: number;
}
