import axios from 'axios';
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  ApiResponse,
  StatsOverview,
  WeeklyActivity,
  MonthlyTrend,
  PriorityBreakdown,
  TagBreakdown,
} from '../types/task';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Task CRUD ───────────────────────────────────────────

export const getTasks = async (params?: {
  status?: string;
  priority?: string;
  sort?: string;
  search?: string;
  tag?: string;
}): Promise<Task[]> => {
  const { data } = await api.get<ApiResponse<Task[]>>('/tasks', { params });
  return data.data;
};

export const createTask = async (payload: CreateTaskPayload): Promise<Task> => {
  const { data } = await api.post<ApiResponse<Task>>('/tasks', payload);
  return data.data;
};

export const updateTask = async (id: string, payload: UpdateTaskPayload): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, payload);
  return data.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

// ─── Stats ───────────────────────────────────────────────

export const getStatsOverview = async (): Promise<StatsOverview> => {
  const { data } = await api.get<ApiResponse<StatsOverview>>('/stats/overview');
  return data.data;
};

export const getWeeklyActivity = async (): Promise<WeeklyActivity[]> => {
  const { data } = await api.get<ApiResponse<WeeklyActivity[]>>('/stats/weekly');
  return data.data;
};

export const getMonthlyTrend = async (): Promise<MonthlyTrend[]> => {
  const { data } = await api.get<ApiResponse<MonthlyTrend[]>>('/stats/monthly');
  return data.data;
};

export const getPriorityBreakdown = async (): Promise<PriorityBreakdown[]> => {
  const { data } = await api.get<ApiResponse<PriorityBreakdown[]>>('/stats/priority');
  return data.data;
};

export const getTagsBreakdown = async (): Promise<TagBreakdown[]> => {
  const { data } = await api.get<ApiResponse<TagBreakdown[]>>('/stats/tags');
  return data.data;
};
