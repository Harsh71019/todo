import { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import * as taskApi from '../services/taskApi';
import type {
  StatsOverview,
  WeeklyActivity,
  MonthlyTrend,
  PriorityBreakdown,
  TagBreakdown,
  DayOfWeekStats,
  VelocityStats,
} from '../types/task';
import StatCard from '../components/StatCard';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [weekly, setWeekly] = useState<WeeklyActivity[]>([]);
  const [monthly, setMonthly] = useState<MonthlyTrend[]>([]);
  const [priority, setPriority] = useState<PriorityBreakdown[]>([]);
  const [, setTags] = useState<TagBreakdown[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeekStats[]>([]);
  const [velocity, setVelocity] = useState<VelocityStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [oData, wData, mData, pData, tData, dData, vData] =
          await Promise.all([
            taskApi.getStatsOverview(),
            taskApi.getWeeklyActivity(),
            taskApi.getMonthlyTrend(),
            taskApi.getPriorityBreakdown(),
            taskApi.getTagsBreakdown(),
            taskApi.getDayOfWeekStats(),
            taskApi.getVelocityStats(),
          ]);
        setOverview(oData);
        setWeekly(wData);
        setMonthly(mData);
        setPriority(pData);
        setTags(tData);
        setDayOfWeek(dData);
        setVelocity(vData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
        <header className='mb-8'>
          <div className='h-8 w-48 bg-slate-200 rounded animate-pulse mb-2' />
          <div className='h-4 w-64 bg-slate-200 rounded animate-pulse' />
        </header>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className='h-28 bg-white border border-slate-200 rounded-2xl animate-pulse'
            />
          ))}
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='h-80 bg-white border border-slate-200 rounded-2xl animate-pulse' />
          <div className='h-80 bg-white border border-slate-200 rounded-2xl animate-pulse' />
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className='flex flex-col items-center justify-center py-20 text-center'>
        <div className='w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4'>
          <svg
            width='32'
            height='32'
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
        </div>
        <h2 className='text-xl font-bold text-slate-800 mb-2'>
          Error Loading Dashboard
        </h2>
        <p className='text-slate-500'>{error}</p>
      </div>
    );
  }

  const PRIORITY_COLORS = {
    low: '#10b981', // emerald-500
    medium: '#f59e0b', // amber-500
    high: '#ef4444', // red-500
  };

  return (
    <div className='animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10'>
      <header className='mb-6 lg:mb-8'>
        <h2 className='text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight'>
          Analytics Dashboard
        </h2>
        <p className='text-sm sm:text-base text-slate-500 mt-1'>
          Deep insights into your productivity habits and velocity.
        </p>
      </header>

      {/* Top Cards Row */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <StatCard
          title='Current Streak'
          value={`${overview.currentStreak} 🔥`}
          subtitle='Consecutive days with completions'
          color='amber'
          icon={
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z'></path>
            </svg>
          }
        />
        <StatCard
          title='Completed Today'
          value={overview.completedToday}
          subtitle={`${overview.createdToday} created today`}
          color='emerald'
          icon={
            <svg
              width='24'
              height='24'
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
          }
        />
        <StatCard
          title='Pending Tasks'
          value={overview.pendingTasks}
          subtitle={`${overview.overdueTasks} overdue`}
          color='blue'
          icon={
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10'></circle>
              <polyline points='12 6 12 12 16 14'></polyline>
            </svg>
          }
        />
        <StatCard
          title='Total Completed'
          value={`${overview.completedTasks}`}
          subtitle={`${overview.completionRate}% completion rate`}
          color='purple'
          icon={
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M20 6L9 17l-5-5'></path>
            </svg>
          }
        />
        <StatCard
          title='Active Long-Term'
          value={overview.activeLongTermTasks}
          subtitle='Goals requiring sustained effort'
          color='indigo'
          icon={
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'></path>
            </svg>
          }
        />
        <StatCard
          title='Estimation Accuracy'
          value={`${Math.round(overview.estimatedVsActualRatio * 100) || 0}%`}
          subtitle='Estimated vs Actual time ratio'
          color='emerald'
          icon={
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10'></circle>
              <polyline points='12 6 12 12 16 14'></polyline>
            </svg>
          }
        />
        <StatCard
          title='Avg Per Day'
          value={overview.avgCompletedPerDay}
          subtitle='Lifetime average tasks completed'
          color='blue'
          icon={
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='12' y1='20' x2='12' y2='10'></line>
              <line x1='18' y1='20' x2='18' y2='4'></line>
              <line x1='6' y1='20' x2='6' y2='16'></line>
            </svg>
          }
        />
        <StatCard
          title='In Trash'
          value={overview.trashCount}
          subtitle='Tasks pending permanent deletion'
          color='red'
          icon={
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <polyline points='3 6 5 6 21 6'></polyline>
              <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'></path>
            </svg>
          }
        />
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6 mb-6'>
        {/* Radar Chart: Productivity by Day of Week */}
        <div className='bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
          <h3 className='text-base font-bold text-slate-800 mb-1'>
            Productivity Rhythm
          </h3>
          <p className='text-xs text-slate-500 mb-6'>
            Which days are you most productive?
          </p>
          <div className='h-64 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <RadarChart cx='50%' cy='50%' outerRadius='70%' data={dayOfWeek}>
                <PolarGrid stroke='#e2e8f0' />
                <PolarAngleAxis
                  dataKey='day'
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 'auto']}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  name='Completed Tasks'
                  dataKey='completed'
                  stroke='#8b5cf6'
                  fill='#8b5cf6'
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  itemStyle={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#8b5cf6',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Area Chart */}
        <div className='bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
          <h3 className='text-base font-bold text-slate-800 mb-1'>
            4-Week Velocity Trend
          </h3>
          <p className='text-xs text-slate-500 mb-6'>
            Your task momentum over the last month
          </p>
          <div className='h-64 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <AreaChart
                data={monthly}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id='colorCompleted'
                    x1='0'
                    y1='0'
                    x2='0'
                    y2='1'
                  >
                    <stop offset='5%' stopColor='#10b981' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id='colorCreated' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor='#94a3b8' stopOpacity={0.3} />
                    <stop offset='95%' stopColor='#94a3b8' stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  stroke='#e2e8f0'
                />
                <XAxis
                  dataKey='week'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                />
                <Legend
                  iconType='circle'
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Area
                  type='monotone'
                  dataKey='created'
                  name='Created'
                  stroke='#94a3b8'
                  fillOpacity={1}
                  fill='url(#colorCreated)'
                  strokeWidth={2}
                />
                <Area
                  type='monotone'
                  dataKey='completed'
                  name='Completed'
                  stroke='#10b981'
                  fillOpacity={1}
                  fill='url(#colorCompleted)'
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className='bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
          <h3 className='text-base font-bold text-slate-800 mb-1'>
            Weekly Activity
          </h3>
          <p className='text-xs text-slate-500 mb-6'>
            Tasks created vs completed over the last 7 days
          </p>
          <div className='h-64 w-full'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={weekly}
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray='3 3'
                  vertical={false}
                  stroke='#e2e8f0'
                />
                <XAxis
                  dataKey='day'
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                />
                <Legend
                  iconType='circle'
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar dataKey="created" name="Created" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Time-to-Completion Breakdown (Velocity Stats) */}
        <div className='lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm'>
          <h3 className='text-base font-bold text-slate-800 mb-1'>
            Velocity by Priority
          </h3>
          <p className='text-xs text-slate-500 mb-6'>
            Average hours taken to complete tasks
          </p>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            {velocity.map((v) => (
              <div
                key={v.priority}
                className={`p-4 rounded-xl border ${
                  v.priority === 'high'
                    ? 'bg-red-50/50 border-red-100'
                    : v.priority === 'medium'
                      ? 'bg-amber-50/50 border-amber-100'
                      : 'bg-emerald-50/50 border-emerald-100'
                }`}
              >
                <div className='flex items-center gap-2 mb-3'>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      v.priority === 'high'
                        ? 'bg-red-500'
                        : v.priority === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                  />
                  <span className='text-xs font-bold uppercase tracking-wider text-slate-600'>
                    {v.priority}
                  </span>
                </div>
                <div className='space-y-2'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-slate-500'>Average:</span>
                    <span className='font-semibold text-slate-800'>
                      {v.avgHours !== null ? `${v.avgHours}h` : '-'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-slate-500'>Fastest:</span>
                    <span className='font-semibold text-slate-800'>
                      {v.fastestHours !== null ? `${v.fastestHours}h` : '-'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-slate-500'>Longest:</span>
                    <span className='font-semibold text-slate-800'>
                      {v.longestHours !== null ? `${v.longestHours}h` : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Pie Chart */}
        <div className='bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col'>
          <h3 className='text-base font-bold text-slate-800 mb-1'>
            Priority Distribution
          </h3>
          <p className='text-xs text-slate-500 mb-6'>
            All tasks by priority level
          </p>
          <div className='flex-1 min-h-[200px] w-full flex items-center justify-center'>
            {priority.every((p) => p.total === 0) ? (
              <div className='text-sm text-slate-400'>No data available</div>
            ) : (
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={priority}
                    cx='50%'
                    cy='50%'
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey='total'
                    nameKey='priority'
                  >
                    {priority.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          PRIORITY_COLORS[
                            entry.priority as keyof typeof PRIORITY_COLORS
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{
                      fontSize: '13px',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  />
                  <Legend
                    verticalAlign='bottom'
                    height={36}
                    iconType='circle'
                    formatter={(value) => (
                      <span className='capitalize text-slate-600 text-xs font-medium'>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
