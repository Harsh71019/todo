import { useState, useEffect } from 'react';
import { getMe, type AuthUser } from '../services/authApi';

interface AuthState {
  user: AuthUser | null;
  isPending: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, isPending: true });

  useEffect(() => {
    getMe()
      .then(user => setState({ user, isPending: false }))
      .catch(() => setState({ user: null, isPending: false }));
  }, []);

  return state;
}
