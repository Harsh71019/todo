import type { Task } from '../types/task';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TaskCard = ({ task, onToggle, onDelete }: TaskCardProps) => {
  const isCompleted = task.status === 'completed';

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

  return (
    <div className={`task-card ${isCompleted ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <button
        className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={() => onToggle(task._id)}
        aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
      >
        {isCompleted && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="task-content">
        <div className="task-header">
          <span className={`task-title ${isCompleted ? 'strikethrough' : ''}`}>
            {task.title}
          </span>
          <span className={`priority-badge ${task.priority}`}>
            {task.priority}
          </span>
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        {task.tags && task.tags.length > 0 && (
          <div className="task-tags">
            {task.tags.map((tag) => (
              <span key={tag} className="task-tag">{tag}</span>
            ))}
          </div>
        )}

        <div className="task-meta">
          <span className="task-meta-item">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="6" cy="6" r="5" />
              <path d="M6 3v3l2 1" strokeLinecap="round" />
            </svg>
            {getRelativeTime(task.createdAt)}
          </span>

          {task.dueDate && (
            <span className={`task-meta-item ${isOverdue ? 'overdue-text' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1.5" y="2" width="9" height="8" rx="1.5" />
                <path d="M1.5 5h9M4 1v2M8 1v2" strokeLinecap="round" />
              </svg>
              Due {formatDate(task.dueDate)}
            </span>
          )}

          {isCompleted && task.completedAt && (
            <span className="task-meta-item completed-text">
              ✓ Completed {getRelativeTime(task.completedAt)}
            </span>
          )}
        </div>
      </div>

      <button
        className="task-delete"
        onClick={() => onDelete(task._id)}
        aria-label="Delete task"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
};

export default TaskCard;
