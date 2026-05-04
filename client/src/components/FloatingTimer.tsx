import { useTimer } from '../context/TimerContext';
import { useNavigate } from 'react-router-dom';

const FloatingTimer = () => {
  const { activeTask, focusTask, timeLeft, isActive, phase, setFocusTask, pauseTimer, resumeTimer, stopTimer, skipBreak } = useTimer();
  const navigate = useNavigate();

  if (!activeTask) return null;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const handleOpen = () => {
    if (!focusTask) {
      navigate('/tasks');
      setFocusTask(activeTask);
    }
  };

  const isBreak = phase === 'short-break' || phase === 'long-break';
  
  const getPhaseStyles = () => {
    switch (phase) {
      case 'short-break': return { dot: 'bg-emerald-500', ping: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', label: 'Break' };
      case 'long-break': return { dot: 'bg-violet-500', ping: 'bg-violet-400', text: 'text-violet-600 dark:text-violet-400', label: 'Long Break' };
      default: return { dot: 'bg-blue-500', ping: 'bg-blue-400', text: 'text-blue-600 dark:text-blue-400', label: '' };
    }
  };

  const styles = getPhaseStyles();

  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-3 py-1.5 shadow-sm">
      {/* pulse dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        {isActive && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${styles.ping} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? styles.dot : 'bg-slate-300 dark:bg-neutral-600'}`} />
      </span>

      {/* task name + time — click to open modal */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 min-w-0"
        title={activeTask.title}
      >
        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[100px] hidden sm:block">
          {activeTask.title}
        </span>
        <span className={`font-mono font-bold text-sm tabular-nums flex items-center gap-1.5 ${isBreak ? styles.text : 'text-slate-900 dark:text-white'}`}>
          {styles.label && <span className="text-[10px] uppercase tracking-wider font-sans">{styles.label} ·</span>}
          {formatted}
        </span>
      </button>

      {/* skip break */}
      {isBreak && (
        <button
          onClick={skipBreak}
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Skip
        </button>
      )}

      {/* pause / resume */}
      {!isBreak && (
        <button
          onClick={isActive ? pauseTimer : resumeTimer}
          title={isActive ? 'Pause' : 'Resume'}
          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          {isActive ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
      )}

      {/* stop */}
      <button
        onClick={stopTimer}
        title="Stop timer"
        className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  );
};

export default FloatingTimer;
