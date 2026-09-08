import { App } from 'antd';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '../../../lib/format';
import {
  fetchCurrentSession,
  login as loginRequest,
} from '../api/authService';
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
} from '../types/auth.types';

const STORAGE_KEY = 'dms-lite-auth';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSessionReady: boolean;
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

function toAuthUser(accessToken: string, session: AuthSession): AuthUser {
  return {
    accessToken,
    ...session,
  };
}

function sameAuthorizationSnapshot(left: AuthUser, right: AuthUser) {
  return left.userId === right.userId
    && left.tenantId === right.tenantId
    && left.roles.join('|') === right.roles.join('|')
    && left.permissions.join('|') === right.permissions.join('|');
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialUser] = useState<AuthUser | null>(readStoredUser);
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [isSessionReady, setSessionReady] = useState(!initialUser?.accessToken);
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { t } = useTranslation();

  useEffect(() => {
    const accessToken = initialUser?.accessToken;
    if (!accessToken) {
      return;
    }

    let cancelled = false;

    fetchCurrentSession()
      .then((session) => {
        const currentStoredUser = readStoredUser();
        if (cancelled || currentStoredUser?.accessToken !== accessToken) {
          return;
        }

        const refreshedUser = toAuthUser(accessToken, session);
        if (!sameAuthorizationSnapshot(initialUser, refreshedUser)) {
          // Server state may contain fields that are no longer visible after a role change.
          queryClient.clear();
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshedUser));
        setUser(refreshedUser);
      })
      .catch(() => {
        // A 401 is handled by the shared API interceptor. For temporary network errors,
        // keep the local session so the user can retry when the backend is reachable.
      })
      .finally(() => {
        if (!cancelled) {
          setSessionReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialUser, queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user?.accessToken),
      isSessionReady,
      async login(payload) {
        try {
          const authUser = await loginRequest(payload);

          // Never reuse server-state cached under a previous authenticated identity.
          queryClient.clear();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          setUser(authUser);
          setSessionReady(true);
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
        setSessionReady(true);
      },
    }),
    [isSessionReady, message, queryClient, t, user],
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
