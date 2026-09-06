import { App } from 'antd';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../../lib/format';
import { login as loginRequest } from '../api/authService';
import type {
  AuthUser,
  LoginPayload,
} from '../types/auth.types';

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
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.accessToken),
      async login(payload) {
        try {
          const authUser = await loginRequest(payload);

          // Never reuse server-state cached under a previous authenticated identity.
          queryClient.clear();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          setUser(authUser);
          message.success(t('toast.auth.welcome', { name: authUser.fullName || authUser.username }));
        } catch (error) {
          message.error(getErrorMessage(error));
          throw error;
        }
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);

        // Query keys are domain-scoped, so authenticated server-state must be
        // removed whenever the browser session changes identity.
        queryClient.clear();
        setUser(null);
      },
    }),
    [message, queryClient, t, user],
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
