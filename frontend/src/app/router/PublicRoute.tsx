import { Navigate } from 'react-router-dom';
import {
  LoginPage,
  useAuth,
} from '../../features/auth';

export function PublicRoute() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />;
}
