export type FocusSessionStatus = 'active' | 'completed' | 'abandoned';

export interface FocusSession {
  _id: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  isPomodoro: boolean;
  status: FocusSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSession extends Omit<FocusSession, 'taskId'> {
  taskId: import('./task').Task; // populated
}

export interface FocusTodayStats {
  totalSeconds: number;
  totalSessions: number;
  totalPomodoros: number;
}

export interface FocusWeeklyStat {
  date: string;
  totalSeconds: number;
  pomodoros: number;
}

export interface FocusByTaskStat {
  taskId: string;
  title: string;
  totalSeconds: number;
  pomodoros: number;
  sessions: number;
}
