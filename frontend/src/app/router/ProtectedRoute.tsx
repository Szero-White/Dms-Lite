import {
  Navigate,
  Outlet,
} from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { AppLayout } from '../layouts';

export function ProtectedRoute() {
  const { isAuthenticated, isSessionReady } = useAuth();

  if (!isSessionReady) {
    return null;
  }

  return isAuthenticated ? (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ) : (
    <Navigate to="/login" replace />
  );
}
