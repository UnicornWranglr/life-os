// ProtectedRoute — wraps all authenticated pages.
//
// While the auth state is loading (initial localStorage read), renders
// nothing to avoid a flash of the login page on refresh. Once loaded:
// - Authenticated: renders the nested <Outlet /> (the page content)
// - Unauthenticated: redirects to /login, preserving the intended destination
//   in location state so Login can send the user back after a successful login.

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
