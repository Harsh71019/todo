import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Task } from '../types/task';
import * as focusApi from '../services/focusApi';

const POMODORO = 25 * 60;

interface TimerContextValue {
  focusTask: Task | null;
  setFocusTask: (task: Task | null) => void;
  activeTask: Task | null;
  timeLeft: number;
  isActive: boolean;
  sessionId: string | null;
  startTimer: (task: Task) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
  completeTimer: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(POMODORO);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Restore active session on mount (survives page refresh)
  useEffect(() => {
    focusApi.getActiveSession()
      .then((session) => {
        if (!session) return;
        const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
        const remaining = Math.max(0, POMODORO - elapsed);
        if (remaining === 0) {
          focusApi.stopSession(session._id, 'abandoned').catch(() => {});
          return;
        }
        setActiveTask(session.taskId as unknown as Task);
        setSessionId(session._id);
        setTimeLeft(remaining);
        setIsActive(true);
      })
      .catch(() => {});
  }, []);

  // Tick
  useEffect(() => {
    if (!isActive) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const startTimer = (task: Task) => {
    if (activeTask?._id !== task._id) {
      setActiveTask(task);
      setTimeLeft(POMODORO);
      setIsActive(false);
      setSessionId(null);
    }
  };

  const resumeTimer = () => {
    if (!activeTask) return;
    setIsActive(true);
    focusApi.startSession(activeTask._id)
      .then((s) => setSessionId(s._id))
      .catch(() => {});
  };

  const pauseTimer = () => {
    setIsActive(false);
    if (sessionId) {
      focusApi.stopSession(sessionId, 'abandoned').catch(() => {});
      setSessionId(null);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(POMODORO);
    if (sessionId) {
      focusApi.stopSession(sessionId, 'abandoned').catch(() => {});
      setSessionId(null);
    }
  };

  const stopTimer = () => {
    if (sessionId) {
      focusApi.stopSession(sessionId, 'abandoned').catch(() => {});
    }
    setActiveTask(null);
    setTimeLeft(POMODORO);
    setIsActive(false);
    setSessionId(null);
  };

  const completeTimer = () => {
    if (sessionId) {
      focusApi.stopSession(sessionId, 'completed').catch(() => {});
    }
    setActiveTask(null);
    setTimeLeft(POMODORO);
    setIsActive(false);
    setSessionId(null);
  };

  return (
    <TimerContext.Provider value={{
      focusTask, setFocusTask,
      activeTask, timeLeft, isActive, sessionId,
      startTimer, pauseTimer, resumeTimer, resetTimer, stopTimer, completeTimer,
    }}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
};
