import type { Task } from '../types/task';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
}

const TaskCard = ({ task, onToggle, onDelete, onEdit, onDuplicate, onToggleSubtask, onFocusStart, onRestore, onPermanentDelete }: TaskCardProps) => {
  const isCompleted = task.status === 'completed';
  const isDeleted = task.isDeleted;

  const isOverdue =
    task.dueDate &&
    task.status === 'pending' &&
    new Date(task.dueDate) < new Date();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const getTimeTaken = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();
    const diffMins = Math.floor((end - start) / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const completedSubtasksCount = task.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasksCount = task.subtasks?.length || 0;
  const subtaskProgress = totalSubtasksCount > 0 ? (completedSubtasksCount / totalSubtasksCount) * 100 : 0;

  return (
    <div className={`group flex flex-col gap-3 sm:gap-4 border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
      isDeleted ? 'bg-red-50/50 border-red-100 opacity-80 dark:bg-red-900/10 dark:border-red-900/30' : 
      isCompleted ? 'opacity-60 bg-slate-50 border-slate-200 dark:bg-[#0a0a0a] dark:border-neutral-800' : 'bg-white border-slate-200 hover:border-blue-200 dark:bg-black dark:border-neutral-800 dark:hover:border-blue-500'
    } ${isOverdue && !isDeleted ? 'border-l-4 border-l-red-500 dark:border-l-red-600' : ''}`}>
      
      <div className="flex items-start gap-3 sm:gap-4">
        {!isDeleted ? (
          <button
            className={`shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
              isCompleted 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'border-slate-300 bg-transparent hover:border-blue-500 dark:border-neutral-600 dark:hover:border-blue-500'
            }`}
            onClick={() => onToggle(task._id)}
            aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
          >
            {isCompleted && (
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        ) : (
          <div className="shrink-0 w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-red-300 bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 flex items-center justify-center mt-0.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-500 dark:text-red-400" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-[15px] sm:text-base font-medium break-words ${
              isDeleted ? 'line-through text-red-800 dark:text-red-400' : 
              isCompleted ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'
            }`}>
              {task.title}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              task.priority === 'low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
              task.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {task.priority}
            </span>
            {task.isLongTerm && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                24h+
              </span>
            )}
          </div>

          {task.description && (
            <div className={`text-sm mb-2.5 break-words line-clamp-2 [&>p]:mb-1 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4 [&>a]:text-blue-600 dark:[&>a]:text-blue-400 [&>a]:underline [&>pre]:bg-slate-100 dark:[&>pre]:bg-neutral-800 [&>pre]:p-1 [&>pre]:rounded [&>code]:bg-slate-100 dark:[&>code]:bg-neutral-800 [&>code]:px-1 [&>code]:rounded ${isDeleted ? 'text-red-700/70 dark:text-red-400/70' : 'text-slate-600 dark:text-slate-300'}`}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {task.description}
              </ReactMarkdown>
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {task.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100/50 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="5" />
                <path d="M6 3v3l2 1" strokeLinecap="round" />
              </svg>
              {getRelativeTime(task.createdAt)}
            </span>

            {task.dueDate && !isDeleted && (
              <span className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1.5" y="2" width="9" height="8" rx="1.5" />
                  <path d="M1.5 5h9M4 1v2M8 1v2" strokeLinecap="round" />
                </svg>
                Due {formatDate(task.dueDate)}
              </span>
            )}

            {task.estimatedMinutes && task.estimatedMinutes > 0 && !isDeleted && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                Est. {task.estimatedMinutes}m
              </span>
            )}

            {isCompleted && task.completedAt && !isDeleted && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Done {getRelativeTime(task.completedAt)} (Took {getTimeTaken(task.createdAt, task.completedAt)})
              </span>
            )}

            {isDeleted && task.deletedAt && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Deleted {getRelativeTime(task.deletedAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDeleted ? (
            <>
              {onRestore && (
                <button
                  className="shrink-0 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-all font-semibold text-xs flex items-center gap-1"
                  onClick={() => onRestore(task._id)}
                  aria-label="Restore task"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"></polyline><path d="M20 20v-7a4 4 0 0 0-4-4H4"></path></svg>
                  Restore
                </button>
              )}
              {onPermanentDelete && (
                <button
                  className="shrink-0 p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-md transition-all font-semibold text-xs flex items-center gap-1"
                  onClick={() => onPermanentDelete(task._id)}
                  aria-label="Delete forever"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  Forever
                </button>
              )}
            </>
          ) : (
            <>
              {!isCompleted && onFocusStart && (
                <button
                  className="shrink-0 p-1.5 text-blue-500 hover:text-white hover:bg-blue-500 rounded-md transition-all border border-blue-200 hover:border-transparent opacity-0 group-hover:opacity-100 focus:opacity-100 hidden sm:flex items-center gap-1"
                  onClick={() => onFocusStart(task)}
                  aria-label="Focus mode"
                  title="Focus Mode"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden md:inline">Focus</span>
                </button>
              )}

              {!isCompleted && onEdit && (
                <button
                  className="shrink-0 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  onClick={() => onEdit(task)}
                  aria-label="Edit task"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              )}

              {!isCompleted && onDuplicate && (
                <button
                  className="shrink-0 p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  onClick={() => onDuplicate(task)}
                  aria-label="Duplicate task"
                  title="Duplicate Task"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              )}

              <button
                className="shrink-0 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                onClick={() => onDelete(task._id)}
                aria-label="Delete task"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Subtasks Section */}
      {totalSubtasksCount > 0 && (
        <div className="ml-8 sm:ml-10 border-t border-slate-100 dark:border-neutral-800 pt-3">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-1.5 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${subtaskProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${subtaskProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              {completedSubtasksCount} / {totalSubtasksCount}
            </span>
          </div>
          
          <div className="flex flex-col gap-2 mt-2">
            {task.subtasks.map((st, idx) => (
              <label 
                key={st._id || idx} 
                className={`flex items-start gap-2 cursor-pointer group/st ${st.isCompleted ? 'opacity-50' : ''}`}
              >
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    className="peer appearance-none w-3.5 h-3.5 border-2 border-slate-300 dark:border-neutral-600 rounded-sm checked:bg-blue-500 checked:border-blue-500 dark:checked:border-blue-500 cursor-pointer transition-all"
                    checked={st.isCompleted}
                    onChange={() => onToggleSubtask && onToggleSubtask(task._id, idx)}
                    disabled={!onToggleSubtask || isCompleted}
                  />
                  <svg 
                    className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" 
                    viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3"
                  >
                    <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className={`text-sm select-none transition-colors ${
                  st.isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300 group-hover/st:text-slate-900 dark:group-hover/st:text-slate-100'
                }`}>
                  {st.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
