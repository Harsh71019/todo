import { useState, useEffect } from 'react';
import type { Task } from '../types/task';

interface FocusModalProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
}

const FocusModal = ({ task, onClose, onComplete }: FocusModalProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive) {
      interval = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsActive(false);
            // Play a sound or show a notification ideally
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0a0a0a] dark:border dark:border-neutral-800 rounded-3xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center relative overflow-hidden">
        {/* Progress Background */}
        <div 
          className="absolute bottom-0 left-0 h-2 bg-blue-500 transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 p-2 rounded-full transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>

        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Focus Mode</h2>
        <p className="text-xl font-semibold text-slate-800 dark:text-slate-100 text-center mb-8">{task.title}</p>

        <div className="text-7xl font-bold text-slate-900 dark:text-slate-50 tracking-tighter mb-8 font-mono tabular-nums">
          {formatTime(timeLeft)}
        </div>

        <div className="flex items-center gap-4 w-full">
          <button
            onClick={toggleTimer}
            className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
              isActive 
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 dark:shadow-none'
            }`}
          >
            {isActive ? 'Pause' : 'Start Focus'}
          </button>

          <button
            onClick={() => {
              onComplete();
              onClose();
            }}
            className="flex-1 py-4 rounded-xl font-bold text-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-all flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusModal;
