import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-fade-in glass-panel p-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the child routes
  return <Outlet />;
};
