import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="url(#logo-gradient)" />
            <path
              d="M8 14.5L12 18.5L20 10.5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="28" y2="28">
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 className="sidebar-title">Taskflow</h1>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/tasks"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="14" height="14" rx="3" />
            <path d="M7 10l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Tasks</span>
        </NavLink>

        <NavLink
          to="/dashboard"
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="10" width="3" height="7" rx="1" />
            <rect x="8.5" y="6" width="3" height="11" rx="1" />
            <rect x="14" y="3" width="3" height="14" rx="1" />
          </svg>
          <span>Dashboard</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-text">
          <span className="sidebar-version">v1.0</span>
          <span className="sidebar-dot">•</span>
          <span>Built with ♥</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
