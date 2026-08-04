import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      console.error('Authentication Error:', error);
      navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (token) {
      // Save token to context (which saves to localStorage)
      setToken(token);
      // Redirect to dashboard
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-fade-in glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Authenticating...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Please wait while we log you in.</p>
      </div>
    </div>
  );
};
