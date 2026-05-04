import type { Subscription } from '../types/subscription';
import { formatDistanceToNow, format } from 'date-fns';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onToggle: (id: string) => void;
}

const SubscriptionCard = ({ subscription, onEdit, onToggle }: SubscriptionCardProps) => {
  const { name, amount, currency, billingCycle, nextBillingDate, category, color, isActive, url } = subscription;

  const cycleLabel = {
    weekly: 'wk',
    monthly: 'mo',
    quarterly: 'qrt',
    yearly: 'yr'
  }[billingCycle];

  const yearlyAmount = {
    weekly: amount * 52,
    monthly: amount * 12,
    quarterly: amount * 4,
    yearly: amount,
  }[billingCycle];

  const currencySymbol = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£'
  }[currency];

  const renewalDate = new Date(nextBillingDate);
  const isOverdue = renewalDate < new Date() && isActive;

  const calculateTotalSpent = () => {
    const start = new Date(subscription.startDate);
    const now = new Date();
    if (start > now) return 0;

    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const daysDiff = Math.floor((now.getTime() - start.getTime()) / 86400000);

    let periods: number;
    switch (subscription.billingCycle) {
      case 'weekly':    periods = Math.max(1, Math.ceil(daysDiff / 7)); break;
      case 'monthly':   periods = Math.max(1, months + 1); break;
      case 'quarterly': periods = Math.max(1, Math.ceil((months + 1) / 3)); break;
      case 'yearly':    periods = Math.max(1, now.getFullYear() - start.getFullYear() + 1); break;
      default:          periods = 1;
    }
    return periods * subscription.amount;
  };

  return (
    <div className={`relative bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 transition-all hover:shadow-lg hover:border-blue-500/30 overflow-hidden ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      {/* Left side accent border */}
      <div 
        className="absolute top-0 left-0 w-1.5 h-full" 
        style={{ backgroundColor: color }}
      />

      <div className="flex justify-between items-start mb-4 pl-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-slate-900 dark:text-white truncate" title={name}>
              {name}
            </h3>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-slate-300 hover:text-blue-500 dark:text-neutral-600 dark:hover:text-blue-400 transition-colors"
                title="Open service"
                onClick={e => e.stopPropagation()}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {category}
          </span>
        </div>
        <div className="text-right ml-2 shrink-0">
          <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {currencySymbol}{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 ml-0.5">/{cycleLabel}</span>
          </div>
          {billingCycle !== 'yearly' && (
            <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
              {currencySymbol}{yearlyAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
            </div>
          )}
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            Spent: {currencySymbol}{calculateTotalSpent().toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-4 pl-2">
        <div className="flex flex-col">
          <span className="text-slate-400 dark:text-slate-500 mb-0.5">Next Renewal</span>
          <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
            {format(renewalDate, 'MMM d, yyyy')}
          </span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-slate-400 dark:text-slate-500 mb-0.5">Remaining</span>
          <span className={`font-semibold ${isOverdue ? 'text-red-500' : 'text-blue-500 dark:text-blue-400'}`}>
            {isOverdue ? 'Overdue' : formatDistanceToNow(renewalDate, { addSuffix: true })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800 pl-2">
        <button
          onClick={() => onEdit(subscription)}
          className="flex-1 py-1.5 rounded-lg bg-slate-50 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-[10px] uppercase tracking-wider transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onToggle(subscription._id)}
          className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-colors ${
            isActive 
              ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100' 
              : 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
          }`}
        >
          {isActive ? 'Pause' : 'Resume'}
        </button>
      </div>

    </div>
  );
};

export default SubscriptionCard;
