export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP';

export interface Subscription {
  _id: string;
  userId: string;
  name: string;
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  startDate: string;
  nextBillingDate: string;
  category: string;
  color: string;
  url?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionInput {
  name: string;
  amount: number;
  currency: Currency;
  billingCycle: BillingCycle;
  startDate: string;
  nextBillingDate: string;
  category: string;
  color: string;
  url?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SubscriptionStats {
  monthlySpend: number;
  yearlySpend: number;
  dueThisMonth: number;
  currency: Currency;
}
