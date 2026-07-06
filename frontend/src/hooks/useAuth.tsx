import { App } from 'antd';
import { PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import { login as loginRequest } from '../services/authService';
import { AuthUser, LoginPayload } from '../types';
import { getErrorMessage } from '../lib/format';

const STORAGE_KEY = 'dms-lite-auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser() {
  const rawValue = localStorage.getItem(STORAGE_KEY);
  return rawValue ? (JSON.parse(rawValue) as AuthUser) : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const { message } = App.useApp();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.accessToken),
      async login(payload) {
        try {
          const authUser = await loginRequest(payload);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          setUser(authUser);
          message.success(`Welcome back, ${authUser.fullName || authUser.username}.`);
        } catch (error) {
          message.error(getErrorMessage(error));
          throw error;
        }
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      },
    }),
    [message, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
