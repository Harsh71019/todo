import axios from 'axios';
import type { FocusSession, ActiveSession, FocusTodayStats, FocusWeeklyStat, FocusByTaskStat } from '../types/focusSession';

const api = axios.create({
  baseURL: '/api/focus',
  withCredentials: true,
});

export const startSession = async (taskId: string): Promise<FocusSession> => {
  const { data } = await api.post('/start', { taskId });
  return data.data;
};

export const stopSession = async (sessionId: string, status: 'completed' | 'abandoned'): Promise<FocusSession> => {
  const { data } = await api.post(`/${sessionId}/stop`, { status });
  return data.data;
};

export const getActiveSession = async (): Promise<ActiveSession | null> => {
  const { data } = await api.get('/active');
  return data.data ?? null;
};

export const getSessionsByTask = async (taskId: string): Promise<FocusSession[]> => {
  const { data } = await api.get(`/task/${taskId}`);
  return data.data;
};

export const getFocusToday = async (): Promise<FocusTodayStats> => {
  const { data } = await api.get('/stats/today');
  return data.data;
};

export const getFocusWeekly = async (): Promise<FocusWeeklyStat[]> => {
  const { data } = await api.get('/stats/weekly');
  return data.data;
};

export const getFocusByTask = async (): Promise<FocusByTaskStat[]> => {
  const { data } = await api.get('/stats/by-task');
  return data.data;
};
