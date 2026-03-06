import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Household } from '../lib/types';
import { getToken, getUser, setAuth, clearAuth } from '../lib/auth';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  household: Household | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User, household: Household | null) => void;
  logout: () => void;
  setHousehold: (h: Household | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: getUser(),
    household: null,
    isLoading: !!getToken(),
  });

  useEffect(() => {
    if (!getToken()) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    api.get('/auth/me')
      .then((res) => {
        setAuth(getToken()!, res.data.user);
        setState({ user: res.data.user, household: res.data.household, isLoading: false });
      })
      .catch(() => {
        clearAuth();
        setState({ user: null, household: null, isLoading: false });
      });
  }, []);

  function login(token: string, user: User, household: Household | null) {
    setAuth(token, user);
    setState({ user, household, isLoading: false });
  }

  function logout() {
    clearAuth();
    setState({ user: null, household: null, isLoading: false });
  }

  function setHousehold(household: Household | null) {
    setState((s) => ({ ...s, household }));
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setHousehold }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
