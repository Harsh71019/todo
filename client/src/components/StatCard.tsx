interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'purple';
}

const StatCard = ({ title, value, subtitle, icon, color = 'blue' }: StatCardProps) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start gap-4 transition-all hover:shadow-md hover:border-blue-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorStyles[color]}`}>
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-3xl font-bold text-slate-800 tracking-tight leading-none mb-1">
          {value}
        </span>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {subtitle && (
          <span className="text-[11px] text-slate-400 mt-1">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
