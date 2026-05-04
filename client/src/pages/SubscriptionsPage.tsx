import { useState } from 'react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import SubscriptionCard from '../components/SubscriptionCard';
import SubscriptionForm from '../components/SubscriptionForm';
import type { Subscription, SubscriptionInput } from '../types/subscription';

const SubscriptionsPage = () => {
  const { 
    subscriptions, 
    loading, 
    error, 
    stats, 
    addSubscription, 
    updateSubscription, 
    deleteSubscription, 
    toggleActive 
  } = useSubscriptions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setIsFormOpen(true);
  };

  const handleSave = async (input: SubscriptionInput) => {
    if (editingSub) {
      await updateSubscription(editingSub._id, input);
    } else {
      await addSubscription(input);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingSub(null);
  };

  const filteredSubs = subscriptions.filter(s => {
    if (filter === 'active') return s.isActive;
    if (filter === 'paused') return !s.isActive;
    return true;
  });

  if (loading && subscriptions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Subscriptions</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {stats.activeCount} active subscriptions · {stats.dueThisMonth} renewals this month
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add Subscription
        </button>
      </header>

      {/* Summary Cards */}
      {(() => {
        const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' };
        const sym = CURRENCY_SYMBOLS[stats.currency] ?? '';
        const fmt = (n: number, decimals = 2) =>
          sym + n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-1">Monthly Spend</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {fmt(stats.monthlySpend)}
              </div>
              {stats.mixedCurrencies && <p className="text-[10px] text-slate-400 mt-1">Mixed currencies — dominant shown</p>}
            </div>
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 block mb-1">Yearly Spend</span>
              <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                {fmt(stats.yearlySpend, 0)}
              </div>
            </div>
            <div className="bg-blue-600 rounded-3xl p-6 shadow-xl shadow-blue-500/20 text-white">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 block mb-1">Due This Month</span>
              <div className="text-3xl font-black tabular-nums">
                {stats.dueThisMonth} <span className="text-sm font-bold uppercase tracking-widest text-blue-100 ml-1">Renewals</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-black' : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-neutral-700'}`}
        >
          All ({subscriptions.length})
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-neutral-700'}`}
        >
          Active ({stats.activeCount})
        </button>
        <button
          onClick={() => setFilter('paused')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${filter === 'paused' ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-neutral-700'}`}
        >
          Paused ({stats.pausedCount})
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/30 mb-6 font-bold text-sm">
          {error}
        </div>
      )}

      {filteredSubs.length === 0 ? (
        <div className="bg-slate-50 dark:bg-neutral-900/50 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-3xl flex items-center justify-center shadow-xl mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-300"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No subscriptions found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {filter !== 'all' ? `You don't have any ${filter} subscriptions.` : "Start tracking your recurring bills by adding your first subscription."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubs.map(sub => (
            <SubscriptionCard
              key={sub._id}
              subscription={sub}
              onEdit={handleEdit}
              onToggle={toggleActive}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <SubscriptionForm
          subscription={editingSub}
          onSave={handleSave}
          onDelete={deleteSubscription}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default SubscriptionsPage;
