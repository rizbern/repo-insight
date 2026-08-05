import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

export const ProtectedRoute = () => {
  const { token, user, loading, revalidate } = useAuth();
  const location = useLocation();

  // Re-validate token with the backend on every route change
  useEffect(() => {
    revalidate();
  }, [location.pathname, revalidate]);

  // Re-validate when the browser tab regains focus
  useEffect(() => {
    const handleFocus = () => revalidate();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-fade-in glass-panel p-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
