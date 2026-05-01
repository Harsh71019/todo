import type { Task } from '../types/task';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onToggleSubtask?: (taskId: string, subtaskIndex: number) => void;
  onFocusStart?: (task: Task) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
}

const TaskListSkeleton = () => (
  <div className='flex flex-col gap-3'>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className='flex items-start gap-4 bg-white border border-slate-200 rounded-xl p-4'
      >
        <div className='w-6 h-6 rounded bg-slate-200 animate-pulse mt-0.5' />
        <div className='flex-1 flex flex-col gap-2'>
          <div className='h-4 bg-slate-200 rounded w-2/3 animate-pulse' />
          <div className='h-3 bg-slate-200 rounded w-1/3 animate-pulse' />
        </div>
      </div>
    ))}
  </div>
);

const TaskList = ({
  tasks,
  loading,
  onToggle,
  onDelete,
  onEdit,
  onDuplicate,
  onToggleSubtask,
  onFocusStart,
  onRestore,
  onPermanentDelete,
}: TaskListProps) => {
  if (loading) {
    return <TaskListSkeleton />;
  }

  if (tasks.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-20 px-4 mt-8'>
        <div className='relative w-48 h-48 mb-6'>
          {/* Background decoration */}
          <div className='absolute inset-0 bg-blue-50 rounded-full scale-110 blur-xl opacity-70 animate-pulse' />

          {/* Illustration */}
          <div className='relative w-full h-full bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center rotate-3 transition-transform hover:rotate-0 duration-300'>
            <svg
              width='64'
              height='64'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#cbd5e1'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
              className='absolute -top-4 -left-4 -rotate-12'
            >
              <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'></path>
              <polyline points='7 10 12 15 17 10'></polyline>
              <line x1='12' y1='15' x2='12' y2='3'></line>
            </svg>
            <svg
              width='100'
              height='100'
              viewBox='0 0 24 24'
              fill='none'
              stroke='#3b82f6'
              strokeWidth='1'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path
                d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'
                fill='#eff6ff'
              />
              <path d='M8 12l3 3 5-6' strokeWidth='2' />
            </svg>
            <div className='mt-4 h-2 w-16 bg-slate-100 rounded-full' />
            <div className='mt-2 h-2 w-10 bg-slate-100 rounded-full' />
          </div>
        </div>
        <h3 className='text-xl font-bold text-slate-800 mb-2 tracking-tight'>
          A blank canvas awaits
        </h3>
        <p className='text-sm text-slate-500 max-w-sm text-center leading-relaxed'>
          You're completely caught up! Add a new task above to start organizing
          your day, or adjust your filters if you're looking for something
          specific.
        </p>
      </div>
    );
  }

  const groupTasks = () => {
    // If viewing trash or archive (inferred by tasks having isDeleted or all being completed), maybe don't group,
    // but doing it always is fine for consistency. We'll group them nicely.
    const groups: { label: string; tasks: Task[]; color: string }[] = [
      { label: 'Overdue', tasks: [], color: 'text-red-600 bg-red-50' },
      { label: 'Today', tasks: [], color: 'text-blue-600 bg-blue-50' },
      { label: 'Tomorrow', tasks: [], color: 'text-amber-600 bg-amber-50' },
      { label: 'Upcoming', tasks: [], color: 'text-indigo-600 bg-indigo-50' },
      { label: 'No Date', tasks: [], color: 'text-slate-600 bg-slate-50' },
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    tasks.forEach((t) => {
      if (!t.dueDate) {
        groups[4].tasks.push(t);
        return;
      }
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);

      if (
        d.getTime() < today.getTime() &&
        t.status === 'pending' &&
        !t.isDeleted
      ) {
        groups[0].tasks.push(t);
      } else if (d.getTime() === today.getTime()) {
        groups[1].tasks.push(t);
      } else if (d.getTime() === tomorrow.getTime()) {
        groups[2].tasks.push(t);
      } else {
        groups[3].tasks.push(t);
      }
    });

    return groups.filter((g) => g.tasks.length > 0);
  };

  const grouped = groupTasks();

  return (
    <div className='flex flex-col gap-6'>
      {grouped.map((group) => (
        <div key={group.label} className='animate-in fade-in duration-300'>
          <div className='flex items-center gap-3 mb-3'>
            <h4
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${group.color}`}
            >
              {group.label}
            </h4>
            <div className='h-px bg-slate-100 flex-1' />
            <span className='text-xs font-semibold text-slate-400'>
              {group.tasks.length}
            </span>
          </div>
          <div className='flex flex-col gap-3'>
            {group.tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onToggleSubtask={onToggleSubtask}
                onFocusStart={onFocusStart}
                onRestore={onRestore}
                onPermanentDelete={onPermanentDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
