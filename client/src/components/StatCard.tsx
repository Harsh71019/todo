interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'purple';
}

const StatCard = ({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) => {
  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-neutral-700">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorStyles[color]}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-none mb-1">
          {value}
        </span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {subtitle && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
