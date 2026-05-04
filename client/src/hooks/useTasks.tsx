import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
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
  activePriority: string;
  setActivePriority: (priority: string) => void;
  allTags: string[];
  addTask: (payload: CreateTaskPayload) => Promise<void>;
  duplicateTask: (task: Task) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  permanentlyDeleteTask: (id: string) => Promise<void>;
  restoreTask: (id: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;
  unarchiveTask: (id: string) => Promise<void>;
  editTask: (id: string, payload: UpdateTaskPayload) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskIndex: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTasks = (
  view: 'active' | 'archive' | 'trash' | 'completed' = 'active',
): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('-createdAt');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [activePriority, setActivePriority] = useState<string>('all');
  const [allTags, setAllTags] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stable ref for the refresh trigger so CRUD actions can call it
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
    return Promise.resolve();
  }, []);

  // Debounce the search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Primary data fetch — inline async function avoids the setState-in-effect lint warning
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const params: Record<string, string> = { sort: sortBy, view };
        if (filter !== 'all') params.status = filter;
        if (activeTag !== 'all') params.tag = activeTag;
        if (activePriority !== 'all') params.priority = activePriority;
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        const data = await taskApi.getTasks(params);

        if (cancelled) return; // component unmounted — skip state updates

        setTasks(data);
        const tagSet = new Set<string>();
        data.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
        setAllTags(Array.from(tagSet).sort());
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch tasks',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [
    filter,
    sortBy,
    debouncedSearch,
    activeTag,
    activePriority,
    view,
    refreshKey,
  ]);

  const addTask = async (payload: CreateTaskPayload) => {
    try {
      const newTask = await taskApi.createTask(payload);
      setTasks((prev) => [newTask, ...prev]);
    } catch (err) {
      toast.error('Failed to create task');
      throw err; // throw so TaskForm can catch it
    }
  };

  const duplicateTask = async (task: Task) => {
    const payload: CreateTaskPayload = {
      title: `${task.title} (Copy)`,
      description: task.description,
      priority: task.priority,
      tags: task.tags,
      estimatedMinutes: task.estimatedMinutes,
      subtasks: task.subtasks?.map((st) => ({
        title: st.title,
        isCompleted: false,
      })),
      isLongTerm: task.isLongTerm,
      dueDate: task.dueDate,
    };

    const newTask = await taskApi.createTask(payload);
    setTasks((prev) => [newTask, ...prev]);
    toast.success('Task duplicated successfully');
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    const updated = await taskApi.updateTask(id, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));

    if (newStatus === 'completed') {
      toast(
        (t) => (
          <span className='flex items-center gap-3'>
            Task completed! 🎉
            <button
              className='px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors'
              onClick={() => {
                toggleTask(id);
                toast.dismiss(t.id);
              }}
            >
              UNDO
            </button>
          </span>
        ),
        { duration: 4000 },
      );
    }
  };

  const removeTask = async (id: string) => {
    await taskApi.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));

    toast(
      (t) => (
        <span className='flex items-center gap-3'>
          Moved to trash
          <button
            className='px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors'
            onClick={() => {
              restoreTask(id);
              toast.dismiss(t.id);
            }}
          >
            UNDO
          </button>
        </span>
      ),
      { duration: 5000 },
    );
  };

  const permanentlyDeleteTask = async (id: string) => {
    await taskApi.permanentlyDeleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
    toast.success('Task permanently deleted');
  };

  const restoreTask = async (id: string) => {
    await taskApi.restoreTask(id);
    refresh();
    toast.success('Task restored');
  };

  const archiveTask = async (id: string) => {
    await taskApi.archiveTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));

    toast(
      (t) => (
        <span className='flex items-center gap-3'>
          Moved to archive
          <button
            className='px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold transition-colors'
            onClick={() => {
              unarchiveTask(id);
              toast.dismiss(t.id);
            }}
          >
            UNDO
          </button>
        </span>
      ),
      { duration: 5000 },
    );
  };

  const unarchiveTask = async (id: string) => {
    await taskApi.unarchiveTask(id);
    refresh();
    toast.success('Task restored from archive');
  };

  const editTask = async (id: string, payload: UpdateTaskPayload) => {
    const updated = await taskApi.updateTask(id, payload);
    setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  const toggleSubtask = async (taskId: string, subtaskIndex: number) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || !task.subtasks) return;

    // Deep clone the subtasks to avoid mutating state directly
    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[subtaskIndex] = {
      ...updatedSubtasks[subtaskIndex],
      isCompleted: !updatedSubtasks[subtaskIndex].isCompleted,
    };

    await editTask(taskId, { subtasks: updatedSubtasks });
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
    activePriority,
    setActivePriority,
    allTags,
    addTask,
    duplicateTask,
    toggleTask,
    removeTask,
    permanentlyDeleteTask,
    restoreTask,
    archiveTask,
    unarchiveTask,
    editTask,
    toggleSubtask,
    refresh,
  };
};
