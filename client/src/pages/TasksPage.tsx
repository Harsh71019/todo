import { useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import { useTags } from '../hooks/useTags';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';
import FocusModal from '../components/FocusModal';
import type { Task, CreateTaskPayload } from '../types/task';

const TasksPage = () => {
  const {
    tasks,
    loading,
    error,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    activePriority,
    setActivePriority,
    allTags,
    addTask,
    duplicateTask,
    toggleTask,
    removeTask,
    toggleSubtask,
    editTask,
  } = useTasks();

  const { tags: availableTags } = useTags();

  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        if (e.key === 'Escape') {
          (document.activeElement as HTMLElement).blur();
        } else {
          return;
        }
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        const input = document.getElementById('task-title-input');
        if (input) {
          input.focus();
        }
      }
      if (e.key === 'Escape') {
        setEditingTask(null);
        setFocusTask(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCompleteAll = async () => {
    const pendingVisible = tasks.filter((t) => t.status === 'pending');
    if (pendingVisible.length === 0) return;
    await Promise.all(pendingVisible.map((t) => toggleTask(t._id)));
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  const sorts = [
    { key: '-createdAt', label: 'Newest' },
    { key: 'createdAt', label: 'Oldest' },
    { key: '-priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due Date' },
  ];

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className='animate-in fade-in slide-in-from-bottom-4 duration-500 relative'>
      <header className='mb-6 lg:mb-8'>
        <div>
          <h2 className='text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight'>
            My Tasks
          </h2>
          <p className='text-sm sm:text-base text-slate-500 mt-1'>
            <span className='font-medium text-slate-700'>
              {taskCounts.pending}
            </span>{' '}
            pending ·{' '}
            <span className='font-medium text-slate-700'>
              {taskCounts.completed}
            </span>{' '}
            completed
          </p>
        </div>
      </header>

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700'>
          <svg
            className='shrink-0 mt-0.5'
            width='20'
            height='20'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='10'></circle>
            <line x1='12' y1='8' x2='12' y2='12'></line>
            <line x1='12' y1='16' x2='12.01' y2='16'></line>
          </svg>
          <div>
            <h3 className='font-bold text-sm'>Failed to load tasks</h3>
            <p className='text-sm opacity-90 mt-1'>{error}</p>
          </div>
        </div>
      )}

      <TaskForm
        onSubmit={(p) => addTask(p as CreateTaskPayload)}
        availableTags={availableTags}
      />

      <div className='flex flex-col md:flex-row gap-3 mb-6 bg-white p-2 rounded-xl border border-slate-200 shadow-sm'>
        <div className='flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-colors'>
          <svg
            className='text-slate-400 shrink-0'
            width='16'
            height='16'
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <circle cx='7' cy='7' r='5' />
            <path d='M11 11l3 3' strokeLinecap='round' />
          </svg>
          <input
            type='text'
            className='flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 min-w-[150px]'
            placeholder='Search tasks...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto hide-scrollbar'>
          {filters.map((f) => (
            <button
              key={f.key}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                filter === f.key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  filter === f.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {taskCounts[f.key as keyof typeof taskCounts]}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleCompleteAll}
          disabled={tasks.filter((t) => t.status === 'pending').length === 0}
          className='hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed'
          title='Complete all visible pending tasks'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14'></path>
            <polyline points='22 4 12 14.01 9 11.01'></polyline>
          </svg>
          <span className='hidden lg:inline'>Complete All</span>
        </button>

        <select
          className='bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 min-w-[120px] cursor-pointer'
          value={activePriority}
          onChange={(e) => setActivePriority(e.target.value)}
        >
          <option value='all'>Any Priority</option>
          <option value='high'>High Priority</option>
          <option value='medium'>Medium Priority</option>
          <option value='low'>Low Priority</option>
        </select>

        <select
          className='bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 min-w-[120px] cursor-pointer'
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {sorts.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className='flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar'>
          <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0'>
            Tags:
          </span>
          <button
            className={`shrink-0 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
              activeTag === 'all'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setActiveTag('all')}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`shrink-0 px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                activeTag === tag
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <TaskList
        tasks={tasks}
        loading={loading}
        onToggle={toggleTask}
        onDelete={removeTask}
        onDuplicate={duplicateTask}
        onEdit={(task) => setEditingTask(task)}
        onToggleSubtask={toggleSubtask}
        onFocusStart={(task) => setFocusTask(task)}
      />

      {editingTask && (
        <div className='fixed inset-0 bg-slate-800/20 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10'>
              <h3 className='font-bold text-slate-800'>Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className='text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg p-1.5 transition-colors'
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <line x1='18' y1='6' x2='6' y2='18'></line>
                  <line x1='6' y1='6' x2='18' y2='18'></line>
                </svg>
              </button>
            </div>
            <div className='p-4'>
              <TaskForm
                key={editingTask._id}
                initialData={editingTask}
                onSubmit={async (payload) => {
                  await editTask(editingTask._id, payload);
                  setEditingTask(null);
                }}
                onCancel={() => setEditingTask(null)}
                availableTags={availableTags}
              />
            </div>
          </div>
        </div>
      )}

      {focusTask && (
        <FocusModal
          task={focusTask}
          onClose={() => setFocusTask(null)}
          onComplete={() => {
            if (focusTask.status !== 'completed') {
              toggleTask(focusTask._id);
            }
          }}
        />
      )}
    </div>
  );
};

export default TasksPage;
