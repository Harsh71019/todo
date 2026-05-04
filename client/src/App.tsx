import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TimerProvider } from './context/TimerContext';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import TasksPage from './pages/TasksPage';
import DashboardPage from './pages/DashboardPage';
import TagsPage from './pages/TagsPage';
import ArchivePage from './pages/ArchivePage';
import CompletedPage from './pages/CompletedPage';
import TrashPage from './pages/TrashPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

function AppLayout({ isDarkMode, toggleDarkMode }: { isDarkMode: boolean; toggleDarkMode: () => void }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-black text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <main className="flex-1 w-full lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <header className="lg:hidden bg-white dark:bg-black border-b border-slate-200 dark:border-neutral-800 px-4 py-3 flex items-center sticky top-0 z-30 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 mr-2 text-slate-500 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Taskflow</h1>
        </header>

        <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to="/tasks" replace />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/completed" element={<CompletedPage />} />
              <Route path="/trash" element={<TrashPage />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  return (
    <BrowserRouter>
      <TimerProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: isDarkMode
            ? { background: '#000000', border: '1px solid #262626', color: '#fff', borderRadius: '12px' }
            : { background: '#334155', color: '#fff', borderRadius: '12px' },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
            </ProtectedRoute>
          }
        />
      </Routes>
    </TimerProvider>
    </BrowserRouter>
  );
}

export default App;
