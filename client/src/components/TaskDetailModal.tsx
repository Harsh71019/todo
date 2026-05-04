import { useState, useEffect } from 'react';
import type { Task } from '../types/task';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onToggle: (id: string) => void;
  onToggleSubtask?: (taskId: string, subtaskIndex: number) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onEdit?: (task: Task) => void;
}

const TaskDetailModal = ({ 
  task, 
  onClose, 
  onToggle, 
  onToggleSubtask,
  onDelete,
  onArchive,
  onEdit
}: TaskDetailModalProps) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const isCompleted = task.status === 'completed';

  useEffect(() => {
    let interval: number | undefined;
    if (isActive) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Task Content */}
        <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <header className="flex justify-between items-start mb-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                task.priority === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                task.priority === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' :
                'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
              }`}>
                {task.priority} Priority
              </span>
              {task.isLongTerm && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  Long Term
                </span>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </header>

          <h2 className={`text-3xl md:text-4xl font-bold mb-6 tracking-tight ${isCompleted ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-white'}`}>
            {task.title}
          </h2>

          {task.description && (
            <div className="prose prose-slate dark:prose-invert max-w-none mb-10 text-slate-600 dark:text-slate-400 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {task.description}
              </ReactMarkdown>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <section className="mb-10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Subtasks</h3>
              <div className="space-y-3">
                {task.subtasks.map((st, idx) => (
                  <label key={idx} className="flex items-center gap-4 group cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-2 border-slate-200 dark:border-neutral-700 text-blue-600 focus:ring-0 transition-all cursor-pointer"
                      checked={st.isCompleted}
                      onChange={() => onToggleSubtask?.(task._id, idx)}
                    />
                    <span className={`text-lg transition-colors ${st.isCompleted ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {st.title}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {task.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <footer className="flex items-center gap-3 pt-8 border-t border-slate-100 dark:border-neutral-800">
            <button 
              onClick={() => onEdit?.(task)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 dark:bg-neutral-900 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold text-sm uppercase tracking-wider"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit
            </button>
            <button 
              onClick={() => { onDelete(task._id); onClose(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors font-bold text-sm uppercase tracking-wider"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              Delete
            </button>
          </footer>
        </div>

        {/* Right Side: Focus Timer */}
        <div className="w-full md:w-80 bg-slate-50 dark:bg-[#0f0f0f] p-8 md:p-12 border-t md:border-t-0 md:border-l border-slate-200 dark:border-neutral-800 flex flex-col items-center justify-center relative">
          
          <div className="absolute top-0 left-0 h-1 md:h-full md:w-1 bg-blue-500 transition-all duration-1000 ease-linear" style={{ [window.innerWidth > 768 ? 'height' : 'width']: `${progress}%` }} />

          <div className="text-blue-500 mb-6 bg-white dark:bg-neutral-800 p-4 rounded-3xl shadow-xl shadow-blue-500/10">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>

          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Focus Mode</h4>
          <div className="text-6xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tighter mb-10 font-mono">
            {formatTime(timeLeft)}
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => setIsActive(!isActive)}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${
                isActive 
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                  : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
              }`}
            >
              {isActive ? 'Pause' : 'Start Focus'}
            </button>
            
            <button
              onClick={() => { onToggle(task._id); onClose(); }}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${
                isCompleted 
                  ? 'bg-slate-200 text-slate-400 dark:bg-neutral-800 dark:text-neutral-600 cursor-not-allowed' 
                  : 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'
              }`}
              disabled={isCompleted}
            >
              {isCompleted ? 'Completed' : 'Finish Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
