import { useState, useRef, useEffect } from 'react';
import type { Task } from '../types/task';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTimer } from '../context/TimerContext';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onToggleSubtask?: (taskId: string, subtaskIndex: number) => void;
  onFocusStart?: (task: Task) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
}

const TaskCard = ({
  task,
  onToggle,
  onDelete,
  onEdit,
  onDuplicate,
  onToggleSubtask,
  onFocusStart,
  onRestore,
  onPermanentDelete,
  onArchive,
  onUnarchive,
}: TaskCardProps) => {
  const isCompleted = task.status === 'completed';
  const isDeleted = task.isDeleted;
  const isArchived = task.isArchived;
  const { activeTask, isActive } = useTimer();
  const isFocused = activeTask?._id === task._id;
  
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isOverdue = (() => {
    if (!task.dueDate || task.status !== 'pending') return false;
    const endOfDueDay = new Date(task.dueDate);
    endOfDueDay.setHours(23, 59, 59, 999);
    return endOfDueDay < new Date();
  })();

  const priorityColor = {
    high: '#ef4444',   // red-500
    medium: '#f59e0b', // amber-500
    low: '#10b981'     // emerald-500
  }[task.priority];

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('input') ||
      (e.target as HTMLElement).closest('.menu-container')
    ) {
      return;
    }
    if (!isCompleted && !isDeleted) onFocusStart?.(task);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    return format(date, sameYear ? 'MMM d' : 'MMM d, yyyy');
  };

  const formatFocusTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  };

  const completedSubtasksCount = task.subtasks?.filter((st) => st.isCompleted).length || 0;
  const totalSubtasksCount = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasksCount > 0 ? (completedSubtasksCount / totalSubtasksCount) * 100 : 0;

  return (
    <div
      className={`relative flex flex-col gap-3 sm:gap-4 border rounded-2xl p-4 transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden ${
        isDeleted
          ? 'bg-red-50/50 border-red-100 opacity-80 dark:bg-red-900/10 dark:border-red-900/30'
          : isCompleted
            ? 'opacity-60 bg-slate-50/50 border-slate-200 dark:bg-[#0a0a0a] dark:border-neutral-800'
            : isFocused
              ? 'bg-white border-blue-400 dark:bg-black dark:border-blue-500 shadow-xl shadow-blue-500/10'
              : 'bg-white border-slate-200 hover:border-blue-200 dark:bg-black dark:border-neutral-800 dark:hover:border-blue-500'
      }`}
      onClick={handleCardClick}
    >
      {/* Left side accent border based on priority */}
      {!isDeleted && (
        <div 
          className="absolute top-0 left-0 w-1.5 h-full transition-colors" 
          style={{ backgroundColor: isCompleted ? '#cbd5e1' : priorityColor }}
        />
      )}

      <div className="flex items-start gap-3 sm:gap-4 pl-2">
        {!isDeleted ? (
          <button
            className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-all ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-slate-300 bg-white dark:bg-neutral-800 hover:border-blue-500 dark:border-neutral-600 dark:hover:border-blue-500 scale-100 active:scale-90'
            }`}
            onClick={(e) => { e.stopPropagation(); onToggle(task._id); }}
          >
            {isCompleted && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : (
          <div className="shrink-0 w-6 h-6 rounded-lg border-2 border-red-300 bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 flex items-center justify-center mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-500 dark:text-red-400" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h3
                className={`text-base font-bold truncate transition-all ${
                  isDeleted
                    ? 'line-through text-red-800 dark:text-red-400 opacity-50'
                    : isCompleted
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-white'
                }`}
                title={task.title}
              >
                {task.title}
              </h3>
              {isOverdue && !isDeleted && !isCompleted && (
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
                  Overdue
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 menu-container">
              {!isDeleted && !isCompleted && onFocusStart && (
                <button
                  onClick={(e) => { e.stopPropagation(); onFocusStart(task); }}
                  className={`p-1.5 rounded-lg transition-colors ${isFocused ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-neutral-800'}`}
                  title="Focus mode"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                </button>
              )}
              
              {!isDeleted && onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Edit task"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              )}

              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-200">
                    {isDeleted ? (
                      <>
                        {onRestore && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onRestore(task._id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors flex items-center gap-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                            Restore Task
                          </button>
                        )}
                        {onPermanentDelete && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onPermanentDelete(task._id); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Delete Forever
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onDuplicate && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(task); setShowMenu(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            Duplicate
                          </button>
                        )}
                        {isArchived ? (
                          onUnarchive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onUnarchive(task._id); setShowMenu(false); }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-2"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                              Unarchive
                            </button>
                          )
                        ) : (
                          onArchive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onArchive(task._id); setShowMenu(false); }}
                              className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors flex items-center gap-2"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>
                              Archive
                            </button>
                          )
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(task._id); setShowMenu(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          Delete Task
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {task.description && (
            <div
              className={`text-sm mb-3 break-words line-clamp-1 [&>p]:inline [&>ul]:hidden [&>ol]:hidden ${isDeleted ? 'text-red-700/50 dark:text-red-400/50' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {task.description}
              </ReactMarkdown>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-neutral-700 transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {formatDate(task.createdAt)}
              </span>

              {task.dueDate && !isDeleted && (
                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {formatDate(String(task.dueDate))}
                </span>
              )}

              {task.totalFocusSeconds > 0 && !isDeleted && (
                <span className="flex items-center gap-1 text-violet-500">
                  {task.completedPomodoros > 0 && <span>🍅 {task.completedPomodoros}</span>}
                  <span>{formatFocusTime(task.totalFocusSeconds)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simplified Subtasks Progress */}
      {totalSubtasksCount > 0 && (
        <div className="ml-10 pt-2 flex items-center gap-3">
          <div className="flex-1 h-1 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${subtaskProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${subtaskProgress}%` }}
            />
          </div>
          <span className="text-[9px] font-black text-slate-400 tracking-tighter shrink-0">
            {completedSubtasksCount}/{totalSubtasksCount}
          </span>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
