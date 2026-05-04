import axios from 'axios';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
}

const api = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
});

export const signup = async (name: string, email: string, password: string): Promise<AuthUser> => {
  const { data } = await api.post('/signup', { name, email, password });
  return data.data;
};

export const login = async (email: string, password: string): Promise<AuthUser> => {
  const { data } = await api.post('/login', { email, password });
  return data.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/logout');
};

export const getMe = async (): Promise<AuthUser> => {
  const { data } = await api.get('/me');
  return data.data;
};
