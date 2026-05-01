import { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/TaskList';
import FocusModal from '../components/FocusModal';
import type { Task } from '../types/task';

const ArchivePage = () => {
  const {
    tasks,
    loading,
    filter,
    setFilter,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    activeTag,
    setActiveTag,
    allTags,
    toggleTask,
    removeTask,
    toggleSubtask,
  } = useTasks('archive');

  const [focusTask, setFocusTask] = useState<Task | null>(null);

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'completed', label: 'Completed' },
  ];

  const sorts = [
    { key: '-createdAt', label: 'Newest' },
    { key: 'createdAt', label: 'Oldest' },
    { key: '-priority', label: 'Priority' },
  ];

  const taskCounts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <header className="mb-6 lg:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Archive</h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            All tasks you've ever created, safely stored here.
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-colors">
          <svg className="text-slate-400 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder-slate-400 min-w-[150px]"
            placeholder="Search archive..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg overflow-x-auto hide-scrollbar">
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
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                filter === f.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {taskCounts[f.key as keyof typeof taskCounts]}
              </span>
            </button>
          ))}
        </div>

        <select
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 min-w-[120px] cursor-pointer"
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

      {allTags.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">Tags:</span>
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
        onToggleSubtask={toggleSubtask}
        onFocusStart={(task) => setFocusTask(task)}
      />

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

export default ArchivePage;
