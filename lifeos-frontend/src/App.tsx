import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { BottomNav } from '@/components/ui/BottomNav';
import { Login } from '@/pages/Login';
import { Today } from '@/pages/Today';
import { Areas } from '@/pages/Areas';
import { Review } from '@/pages/Review';
import { Insights } from '@/pages/Insights';
import { Me } from '@/pages/Me';

// Layout component for authenticated pages:
// renders the shared BottomNav alongside whatever page Outlet renders.
function AuthLayout() {
  return (
    <>
      <ProtectedRoute />
      <BottomNav />
    </>
  );
}

export function App() {
  return (
    <Routes>
      {/* All authenticated routes share the AuthLayout (ProtectedRoute + BottomNav) */}
      <Route element={<AuthLayout />}>
        <Route index element={<Navigate to="/today" replace />} />
        <Route path="today"    element={<Today />} />
        <Route path="areas"    element={<Areas />} />
        <Route path="review"   element={<Review />} />
        <Route path="insights" element={<Insights />} />
        <Route path="me"       element={<Me />} />
      </Route>

      <Route path="/login" element={<Login />} />

      {/* Catch-all — send unknown paths to Today */}
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
