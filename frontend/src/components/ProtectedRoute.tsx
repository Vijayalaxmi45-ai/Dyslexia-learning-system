import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function ProtectedRoute({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const { user, loading, token } = useAuth();
  const loc = useLocation();

  if (loading && token) {
    return (
      <div className="container-page" style={{ paddingTop: '3rem' }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (admin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
