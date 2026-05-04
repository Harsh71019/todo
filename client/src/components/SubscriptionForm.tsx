import { useState, useEffect } from 'react';
import type { Subscription, SubscriptionInput, Currency, BillingCycle } from '../types/subscription';
import { AxiosError } from 'axios';

interface SubscriptionFormProps {
  subscription?: Subscription | null;
  onSave: (input: SubscriptionInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#71717a'  // zinc
];

const CATEGORIES = [
  'Streaming', 'Dev Tools', 'Health', 'Utilities', 'SaaS', 'Education', 'Entertainment', 'Other'
];

const SubscriptionForm = ({ subscription, onSave, onDelete, onClose }: SubscriptionFormProps) => {
  const [formData, setFormData] = useState<SubscriptionInput>({
    name: '',
    amount: 0,
    currency: 'INR',
    billingCycle: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    nextBillingDate: new Date().toISOString().split('T')[0],
    category: 'Streaming',
    color: PRESET_COLORS[0],
    url: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subscription) {
      setFormData({
        name: subscription.name,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        startDate: new Date(subscription.startDate).toISOString().split('T')[0],
        nextBillingDate: new Date(subscription.nextBillingDate).toISOString().split('T')[0],
        category: subscription.category,
        color: subscription.color,
        url: subscription.url || '',
        notes: subscription.notes || ''
      });
    }
  }, [subscription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Basic validation for renewal date
      if (new Date(formData.nextBillingDate) < new Date(formData.startDate)) {
        throw new Error('Renewal date cannot be before start date');
      }

      await onSave(formData);
      onClose();
    } catch (err) {
      const message = err instanceof AxiosError 
        ? err.response?.data?.message 
        : err instanceof Error ? err.message : 'Failed to save subscription';
      setError(message || 'Failed to save subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!subscription || !onDelete) return;
    
    if (window.confirm(`Are you sure you want to delete "${subscription.name}"? This will remove all its history.`)) {
      try {
        setLoading(true);
        await onDelete(subscription._id);
        onClose();
      } catch (err) {
        setError('Failed to delete subscription');
        setLoading(false);
      }
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in duration-200">
        <header className="px-8 py-6 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {subscription ? 'Edit Subscription' : 'Add Subscription'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service Name</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="Netflix, AWS, Spotify..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Amount</label>
              <div className="relative">
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
                  className="absolute right-2 top-1.5 bottom-1.5 bg-white dark:bg-neutral-700 border-none rounded-lg text-[10px] font-bold px-2 outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="INR">INR</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Billing Cycle</label>
              <select
                value={formData.billingCycle}
                onChange={e => setFormData({ ...formData, billingCycle: e.target.value as BillingCycle })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
              <input
                required
                type="date"
                value={formData.startDate}
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Next Renewal</label>
              <input
                required
                type="date"
                min={subscription ? undefined : today}
                value={formData.nextBillingDate}
                onChange={e => setFormData({ ...formData, nextBillingDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Service URL (Optional)</label>
            <input
              type="url"
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="https://netflix.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Accent Color</label>
            <div className="flex flex-wrap gap-3 p-1">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${formData.color === c ? 'border-blue-500/50 scale-110' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            {subscription && (
              <button
                type="button"
                onClick={handleDeleteClick}
                disabled={loading}
                className="flex-1 py-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black uppercase tracking-widest text-sm hover:bg-red-100 transition-all disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              disabled={loading}
              type="submit"
              className={`flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50`}
            >
              {loading ? 'Saving...' : subscription ? 'Update' : 'Add Subscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;
