import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Task } from '../types/task';

const POMODORO = 25 * 60;

interface TimerContextValue {
  focusTask: Task | null;
  setFocusTask: (task: Task | null) => void;
  activeTask: Task | null;
  timeLeft: number;
  isActive: boolean;
  startTimer: (task: Task) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(POMODORO);
  const [isActive, setIsActive] = useState(false);

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
    }
  };

  const pauseTimer = () => setIsActive(false);
  const resumeTimer = () => setIsActive(true);
  const resetTimer = () => { setTimeLeft(POMODORO); setIsActive(false); };
  const stopTimer = () => { setActiveTask(null); setTimeLeft(POMODORO); setIsActive(false); };

  return (
    <TimerContext.Provider value={{
      focusTask, setFocusTask,
      activeTask, timeLeft, isActive,
      startTimer, pauseTimer, resumeTimer, resetTimer, stopTimer,
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
