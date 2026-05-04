import { useState, useEffect, useMemo, useCallback } from 'react';
import * as subApi from '../services/subscriptionApi';
import type { Subscription, SubscriptionInput, BillingCycle } from '../types/subscription';
import { AxiosError } from 'axios';

export const useSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await subApi.getSubscriptions();
      setSubscriptions(data);
      setError(null);
    } catch (err) {
      const message = err instanceof AxiosError
        ? err.response?.data?.error
        : err instanceof Error ? err.message : 'Failed to fetch subscriptions';
      setError(message || 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const addSubscription = async (input: SubscriptionInput) => {
    try {
      const newSub = await subApi.createSubscription(input);
      setSubscriptions(prev => [...prev, newSub]);
      return newSub;
    } catch (err) {
      const message = err instanceof AxiosError 
        ? err.response?.data?.error 
        : err instanceof Error ? err.message : 'Failed to add subscription';
      throw new Error(message || 'Failed to add subscription', { cause: err });
    }
  };

  const updateSubscription = async (id: string, input: Partial<SubscriptionInput>) => {
    try {
      const updatedSub = await subApi.updateSubscription(id, input);
      setSubscriptions(prev => prev.map(s => s._id === id ? updatedSub : s));
      return updatedSub;
    } catch (err) {
      const message = err instanceof AxiosError 
        ? err.response?.data?.error 
        : err instanceof Error ? err.message : 'Failed to update subscription';
      throw new Error(message || 'Failed to update subscription', { cause: err });
    }
  };

  const deleteSubscription = async (id: string) => {
    try {
      await subApi.deleteSubscription(id);
      setSubscriptions(prev => prev.filter(s => s._id !== id));
    } catch (err) {
      const message = err instanceof AxiosError 
        ? err.response?.data?.error 
        : err instanceof Error ? err.message : 'Failed to delete subscription';
      throw new Error(message || 'Failed to delete subscription', { cause: err });
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const updatedSub = await subApi.toggleSubscriptionActive(id);
      setSubscriptions(prev => prev.map(s => s._id === id ? updatedSub : s));
      return updatedSub;
    } catch (err) {
      const message = err instanceof AxiosError 
        ? err.response?.data?.error 
        : err instanceof Error ? err.message : 'Failed to toggle status';
      throw new Error(message || 'Failed to toggle status', { cause: err });
    }
  };

  const normalizeToMonthly = (amount: number, cycle: BillingCycle) => {
    switch (cycle) {
      case 'weekly': return amount * 4.33;
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };

  const calculateTotalSpent = (sub: Subscription) => {
    const start = new Date(sub.startDate);
    const now = new Date();
    if (start > now) return 0;

    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const daysDiff = Math.floor((now.getTime() - start.getTime()) / 86400000);

    let periods: number;
    switch (sub.billingCycle) {
      case 'weekly':    periods = Math.max(1, Math.ceil(daysDiff / 7)); break;
      case 'monthly':   periods = Math.max(1, months + 1); break;
      case 'quarterly': periods = Math.max(1, Math.ceil((months + 1) / 3)); break;
      case 'yearly':    periods = Math.max(1, now.getFullYear() - start.getFullYear() + 1); break;
      default:          periods = 1;
    }
    return periods * sub.amount;
  };

  const stats = useMemo(() => {
    const activeSubs = subscriptions.filter(s => s.isActive);
    const monthlySpend = activeSubs.reduce((acc, s) => acc + normalizeToMonthly(s.amount, s.billingCycle), 0);
    
    // Historical total spend includes even inactive subscriptions
    const totalLifetimeSpend = subscriptions.reduce((acc, s) => acc + calculateTotalSpent(s), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const dueThisMonth = activeSubs.filter(s => {
      const date = new Date(s.nextBillingDate);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const currencies = activeSubs.map(s => s.currency);
    const dominantCurrency = currencies.length > 0
      ? (currencies.sort((a, b) => currencies.filter(c => c === b).length - currencies.filter(c => c === a).length)[0])
      : 'INR';

    return {
      monthlySpend,
      yearlySpend: monthlySpend * 12,
      totalLifetimeSpend,
      dueThisMonth,
      activeCount: activeSubs.length,
      pausedCount: subscriptions.length - activeSubs.length,
      currency: dominantCurrency,
      mixedCurrencies: new Set(currencies).size > 1,
    };
  }, [subscriptions]);

  return {
    subscriptions,
    loading,
    error,
    stats,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    toggleActive,
    refresh: fetchSubscriptions
  };
};
