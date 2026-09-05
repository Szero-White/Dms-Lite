import { Navigate } from 'react-router-dom';
import {
  firstAuthorizedPath,
  LoginPage,
  useAuth,
} from '../../features/auth';

export function PublicRoute() {
  const { isAuthenticated, user } = useAuth();

  return isAuthenticated ? <Navigate to={firstAuthorizedPath(user)} replace /> : <LoginPage />;
}
