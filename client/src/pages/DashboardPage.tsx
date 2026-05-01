import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import StatCard from '../components/StatCard';
import * as taskApi from '../services/taskApi';
import type { StatsOverview, WeeklyActivity, MonthlyTrend, PriorityBreakdown } from '../types/task';

const PRIORITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const DashboardPage = () => {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [weekly, setWeekly] = useState<WeeklyActivity[]>([]);
  const [monthly, setMonthly] = useState<MonthlyTrend[]>([]);
  const [priority, setPriority] = useState<PriorityBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [ov, wk, mn, pr] = await Promise.all([
          taskApi.getStatsOverview(),
          taskApi.getWeeklyActivity(),
          taskApi.getMonthlyTrend(),
          taskApi.getPriorityBreakdown(),
        ]);
        setOverview(ov);
        setWeekly(wk);
        setMonthly(mn);
        setPriority(pr);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="page dashboard-page">
        <header className="page-header">
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Loading analytics...</p>
        </header>
        <div className="dashboard-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-stat-card" />
          ))}
        </div>
      </div>
    );
  }

  const pieData = priority.filter((p) => p.total > 0).map((p) => ({
    name: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
    value: p.total,
    color: PRIORITY_COLORS[p.priority],
  }));

  return (
    <div className="page dashboard-page">
      <header className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Your productivity at a glance</p>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Created This Week"
          value={overview?.createdThisWeek ?? 0}
          color="#6366f1"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l2 2" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          title="Completed This Week"
          value={overview?.completedThisWeek ?? 0}
          color="#22c55e"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
        />
        <StatCard
          title="Completion Rate"
          value={`${overview?.completionRate ?? 0}%`}
          color="#8b5cf6"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3v18M3 12h18" strokeLinecap="round" />
              <path d="M7 7l10 10" strokeLinecap="round" opacity="0.5" />
            </svg>
          }
          subtitle={`${overview?.completedTasks ?? 0} of ${overview?.totalTasks ?? 0} tasks`}
        />
        <StatCard
          title="Pending"
          value={overview?.pendingTasks ?? 0}
          color="#f59e0b"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4" strokeLinecap="round" />
              <circle cx="12" cy="16" r="0.5" fill="currentColor" />
            </svg>
          }
          subtitle={overview?.overdueTasks ? `${overview.overdueTasks} overdue` : undefined}
        />
        <StatCard
          title="Avg. Completion Time"
          value={overview?.avgTimeToCompleteHours ? `${overview.avgTimeToCompleteHours}h` : '–'}
          color="#06b6d4"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Weekly Activity Bar Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Weekly Activity</h3>
          <p className="chart-subtitle">Tasks created vs completed (last 7 days)</p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weekly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e1b4b',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                />
                <Bar dataKey="created" fill="#6366f1" radius={[4, 4, 0, 0]} name="Created" />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Priority Breakdown</h3>
          <p className="chart-subtitle">Tasks by priority level</p>
          <div className="chart-container">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e1b4b',
                      border: '1px solid rgba(99,102,241,0.3)',
                      borderRadius: '12px',
                      color: '#e2e8f0',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">
                <p>No tasks yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="chart-card wide">
          <h3 className="chart-title">Monthly Trend</h3>
          <p className="chart-subtitle">Weekly task activity (last 4 weeks)</p>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e1b4b',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '12px',
                    color: '#e2e8f0',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ fill: '#6366f1', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
