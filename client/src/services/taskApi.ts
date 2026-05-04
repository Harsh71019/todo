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
  DayOfWeekStats,
  VelocityStats,
  HeatmapData,
  TimeOfDayStats,
  FocusDriftStats,
  TagEfficiencyStats,
} from '../types/task';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Task CRUD ───────────────────────────────────────────

export const getTasks = async (params?: {
  status?: string;
  priority?: string;
  sort?: string;
  search?: string;
  tag?: string;
  view?: string;
  page?: number;
  limit?: number;
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

export const archiveTask = async (id: string): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}/archive`);
  return data.data;
};

export const unarchiveTask = async (id: string): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}/unarchive`);
  return data.data;
};

export const permanentlyDeleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}/permanent`);
};

export const restoreTask = async (id: string): Promise<Task> => {
  const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}/restore`);
  return data.data;
};

// ─── Stats ───────────────────────────────────────────────

// Browser timezone sent automatically on every stats request
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
const tzParams = { tz };

export const getStatsOverview = async (): Promise<StatsOverview> => {
  const { data } = await api.get<ApiResponse<StatsOverview>>('/stats/overview', { params: tzParams });
  return data.data;
};

export const getWeeklyActivity = async (): Promise<WeeklyActivity[]> => {
  const { data } = await api.get<ApiResponse<WeeklyActivity[]>>('/stats/weekly', { params: tzParams });
  return data.data;
};

export const getMonthlyTrend = async (): Promise<MonthlyTrend[]> => {
  const { data } = await api.get<ApiResponse<MonthlyTrend[]>>('/stats/monthly', { params: tzParams });
  return data.data;
};

export const getPriorityBreakdown = async (): Promise<PriorityBreakdown[]> => {
  const { data } = await api.get<ApiResponse<PriorityBreakdown[]>>('/stats/priority');
  return data.data;
};

export const getTagsBreakdown = async (): Promise<TagBreakdown[]> => {
  const { data } = await api.get('/stats/tags');
  return data.data;
};

export const getDayOfWeekStats = async (): Promise<DayOfWeekStats[]> => {
  const { data } = await api.get('/stats/day-of-week', { params: tzParams });
  return data.data;
};

export const getVelocityStats = async (): Promise<VelocityStats[]> => {
  const { data } = await api.get('/stats/velocity');
  return data.data;
};

export const getHeatmapStats = async (): Promise<HeatmapData[]> => {
  const { data } = await api.get('/stats/heatmap', { params: tzParams });
  return data.data;
};

export const getTimeOfDayStats = async (): Promise<TimeOfDayStats[]> => {
  const { data } = await api.get('/stats/time-of-day', { params: tzParams });
  return data.data;
};

export const getFocusDriftStats = async (): Promise<FocusDriftStats[]> => {
  const { data } = await api.get('/stats/focus-drift');
  return data.data;
};

export const getTagEfficiencyStats = async (): Promise<TagEfficiencyStats[]> => {
  const { data } = await api.get('/stats/tag-efficiency');
  return data.data;
};
