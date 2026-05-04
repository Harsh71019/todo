import axios from 'axios';
import type { Subscription, SubscriptionInput } from '../types/subscription';

const api = axios.create({
  baseURL: '/api/subscriptions',
  withCredentials: true,
});

export const getSubscriptions = async (): Promise<Subscription[]> => {
  const { data } = await api.get('/');
  return data.data;
};

export const createSubscription = async (subscription: SubscriptionInput): Promise<Subscription> => {
  const { data } = await api.post('/', subscription);
  return data.data;
};

export const updateSubscription = async (id: string, subscription: Partial<SubscriptionInput>): Promise<Subscription> => {
  const { data } = await api.patch(`/${id}`, subscription);
  return data.data;
};

export const deleteSubscription = async (id: string): Promise<void> => {
  await api.delete(`/${id}`);
};

export const toggleSubscriptionActive = async (id: string): Promise<Subscription> => {
  const { data } = await api.patch(`/${id}/toggle`);
  return data.data;
};
