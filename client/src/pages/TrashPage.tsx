import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/TaskList';

const TrashPage = () => {
  const {
    tasks,
    loading,
    searchQuery,
    setSearchQuery,
    restoreTask,
    permanentlyDeleteTask,
  } = useTasks('trash');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <header className="mb-6 lg:mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-red-800 tracking-tight">Trash</h2>
          <p className="text-sm sm:text-base text-red-600/70 mt-1">
            Deleted tasks stay here until permanently removed.
          </p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6 bg-red-50 p-2 rounded-xl border border-red-100 shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white border border-red-200 rounded-lg focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-50 transition-colors">
          <svg className="text-red-400 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3 3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-red-900 placeholder-red-400 min-w-[150px]"
            placeholder="Search trash..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <TaskList
        tasks={tasks}
        loading={loading}
        onToggle={() => {}} // Disabled in trash
        onDelete={() => {}} // Used permanentlyDelete instead
        onRestore={restoreTask}
        onPermanentDelete={permanentlyDeleteTask}
      />
    </div>
  );
};

export default TrashPage;
