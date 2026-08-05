import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-fade-in glass-panel p-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if no token or if token validation failed (user is null)
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Token is valid and user is authenticated — render child routes
  return <Outlet />;
};
