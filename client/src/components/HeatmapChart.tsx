import React from 'react';
import { HeatmapData } from '../types/task';

interface HeatmapChartProps {
  data: HeatmapData[];
}

const HeatmapChart: React.FC<HeatmapChartProps> = ({ data }) => {
  // Generate the last 365 days
  const days = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }

  // Create a map for quick lookup
  const dataMap = new Map(data.map((item) => [item.date, item.count]));

  // Color intensity logic
  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-neutral-900';
    if (count < 3) return 'bg-blue-200 dark:bg-blue-900/40';
    if (count < 6) return 'bg-blue-400 dark:bg-blue-700/60';
    if (count < 10) return 'bg-blue-600 dark:bg-blue-500/80';
    return 'bg-blue-800 dark:bg-blue-400';
  };

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
          <line x1="9" y1="3" x2="9" y2="21"></line>
          <line x1="15" y1="3" x2="15" y2="21"></line>
        </svg>
        Productivity Heatmap
      </h3>
      
      <div className="flex flex-wrap gap-1 items-center justify-center">
        {days.map((date) => {
          const count = dataMap.get(date) || 0;
          return (
            <div
              key={date}
              className={`w-3 h-3 rounded-[2px] ${getColor(count)} transition-all hover:ring-2 hover:ring-blue-400 cursor-help relative group`}
              title={`${date}: ${count} tasks completed`}
            >
               {/* Tooltip for desktop */}
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
                <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap">
                  {date}: {count} tasks
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-[1px] bg-slate-100 dark:bg-neutral-900"></div>
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-200 dark:bg-blue-900/40"></div>
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-400 dark:bg-blue-700/60"></div>
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-600 dark:bg-blue-500/80"></div>
          <div className="w-2.5 h-2.5 rounded-[1px] bg-blue-800 dark:bg-blue-400"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default HeatmapChart;
