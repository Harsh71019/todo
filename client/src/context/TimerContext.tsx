import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task } from '../types/task';
import * as focusApi from '../services/focusApi';
import { playPomodoroComplete, playBreakComplete } from '../utils/sound';

const POMODORO = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

export type TimerPhase = 'idle' | 'focus' | 'short-break' | 'long-break';

interface TimerContextValue {
  focusTask: Task | null;
  setFocusTask: (task: Task | null) => void;
  activeTask: Task | null;
  timeLeft: number;
  isActive: boolean;
  phase: TimerPhase;
  pomodoroCount: number;
  sessionId: string | null;
  startTimer: (task: Task) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
  completeTimer: () => void;
  skipBreak: () => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(POMODORO);
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Restore active session on mount
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
        setPhase('focus');
      })
      .catch(() => {});
  }, []);

  const sendNotification = (title: string, body: string) => {
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  };

  const handlePhaseEnd = useCallback(() => {
    if (phase === 'focus') {
      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);
      
      const isLongBreak = nextCount > 0 && nextCount % 4 === 0;
      const nextPhase = isLongBreak ? 'long-break' : 'short-break';
      const nextTime = isLongBreak ? LONG_BREAK : SHORT_BREAK;

      playPomodoroComplete();
      sendNotification(
        'Pomodoro complete! 🍅',
        isLongBreak ? 'Time for a 15-min break.' : 'Take a 5-min break.'
      );

      if (sessionId) {
        focusApi.stopSession(sessionId, 'completed').catch(() => {});
        setSessionId(null);
      }

      setPhase(nextPhase);
      setTimeLeft(nextTime);
      // Breaks start automatically
      setIsActive(true);
    } else if (phase === 'short-break' || phase === 'long-break') {
      playBreakComplete();
      sendNotification('Break over!', 'Ready for the next pomodoro?');
      
      setPhase('idle');
      setTimeLeft(POMODORO);
      setIsActive(false);
    }
  }, [phase, pomodoroCount, sessionId]);

  // Tick
  useEffect(() => {
    if (!isActive) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handlePhaseEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, handlePhaseEnd]);

  const startTimer = (task: Task) => {
    if (activeTask?._id !== task._id) {
      setActiveTask(task);
      setTimeLeft(POMODORO);
      setIsActive(false);
      setPhase('idle');
      setSessionId(null);
      setPomodoroCount(0);
    }
  };

  const resumeTimer = () => {
    if (!activeTask) return;
    setIsActive(true);
    
    // Only start a backend session if we are in focus phase (or transitioning to it)
    if (phase === 'idle' || phase === 'focus') {
      setPhase('focus');
      focusApi.startSession(activeTask._id)
        .then((s) => setSessionId(s._id))
        .catch(() => {});
    }
  };

  const pauseTimer = () => {
    setIsActive(false);
    if (phase === 'focus' && sessionId) {
      focusApi.stopSession(sessionId, 'abandoned').catch(() => {});
      setSessionId(null);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    if (phase === 'focus' && sessionId) {
      focusApi.stopSession(sessionId, 'abandoned').catch(() => {});
      setSessionId(null);
    }
    setPhase('idle');
    setTimeLeft(POMODORO);
  };

  const stopTimer = () => {
    if (phase === 'focus' && sessionId) {
      focusApi.stopSession(sessionId, 'abandoned').catch(() => {});
    }
    setActiveTask(null);
    setTimeLeft(POMODORO);
    setIsActive(false);
    setPhase('idle');
    setSessionId(null);
    setPomodoroCount(0);
  };

  const completeTimer = () => {
    if (phase === 'focus' && sessionId) {
      focusApi.stopSession(sessionId, 'completed').catch(() => {});
    }
    setActiveTask(null);
    setTimeLeft(POMODORO);
    setIsActive(false);
    setPhase('idle');
    setSessionId(null);
    setPomodoroCount(0);
  };

  const skipBreak = () => {
    setPhase('idle');
    setIsActive(false);
    setTimeLeft(POMODORO);
  };

  return (
    <TimerContext.Provider value={{
      focusTask, setFocusTask,
      activeTask, timeLeft, isActive, phase, pomodoroCount, sessionId,
      startTimer, pauseTimer, resumeTimer, resetTimer, stopTimer, completeTimer,
      skipBreak
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
