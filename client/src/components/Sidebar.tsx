import { NavLink } from 'react-router-dom';
import * as taskApi from '../services/taskApi';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

const Sidebar = ({ isOpen, setIsOpen, isDarkMode, toggleDarkMode }: SidebarProps) => {
  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center justify-between p-4 mb-4 lg:mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-indigo-200">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <path
                d="M8 14.5L12 18.5L20 10.5"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Taskflow</h1>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        <NavLink
          to="/tasks"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="14" height="14" rx="3" />
            <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Tasks</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="10" width="3" height="7" rx="1" />
            <rect x="8.5" y="6" width="3" height="11" rx="1" />
            <rect x="14" y="3" width="3" height="14" rx="1" />
          </svg>
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/tags"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-indigo-50 text-indigo-700' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <span>Tags</span>
        </NavLink>

        <NavLink
          to="/archive"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-blue-50 text-blue-700' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line>
          </svg>
          <span>Archive</span>
        </NavLink>

        <NavLink
          to="/trash"
          onClick={() => setIsOpen(false)}
          className={({ isActive }) => 
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive 
                ? 'bg-red-50 text-red-700' 
                : 'text-slate-600 hover:bg-red-50 hover:text-red-700'
            }`
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          <span>Trash</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
        {toggleDarkMode && (
          <button
            onClick={toggleDarkMode}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDarkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        )}
        <button
          onClick={async () => {
            try {
              const active = await taskApi.getTasks({ view: 'active' });
              const archive = await taskApi.getTasks({ view: 'archive' });
              const trash = await taskApi.getTasks({ view: 'trash' });
              
              // Deduplicate in case of overlap
              const allTasks = [...active, ...archive, ...trash];
              const uniqueTasks = Array.from(new Map(allTasks.map(item => [item._id, item])).values());
              
              const blob = new Blob([JSON.stringify(uniqueTasks, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `taskflow-export-${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success('Data exported successfully');
            } catch (err) {
              toast.error('Failed to export data');
            }
          }}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 font-medium p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Data
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium pl-2">
          <span>v1.0</span>
          <span>•</span>
          <span>Built with ♥</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
