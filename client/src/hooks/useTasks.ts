import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '../types/task';
import * as taskApi from '../services/taskApi';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: string;
  setFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTag: string;
  setActiveTag: (tag: string) => void;
  allTags: string[];
  addTask: (payload: CreateTaskPayload) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  editTask: (id: string, payload: UpdateTaskPayload) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('-createdAt');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = { sort: sortBy };
      if (filter !== 'all') params.status = filter;
      if (activeTag !== 'all') params.tag = activeTag;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const data = await taskApi.getTasks(params);
      setTasks(data);

      // Collect unique tags from all tasks for filter list
      const tags = new Set<string>();
      data.forEach((t) => t.tags?.forEach((tag) => tags.add(tag)));
      setAllTags(Array.from(tags).sort());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filter, sortBy, searchQuery, activeTag]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const addTask = async (payload: CreateTaskPayload) => {
    const newTask = await taskApi.createTask(payload);
    setTasks((prev) => [newTask, ...prev]);
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const updated = await taskApi.updateTask(id, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  const removeTask = async (id: string) => {
    await taskApi.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  const editTask = async (id: string, payload: UpdateTaskPayload) => {
    const updated = await taskApi.updateTask(id, payload);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  return {
    tasks,
    loading,
    error,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    allTags,
    addTask,
    toggleTask,
    removeTask,
    editTask,
    refresh: fetchTasks,
  };
};
