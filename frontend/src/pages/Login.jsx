import { useAuth } from '../context/AuthContext';
import { useSearchParams, Navigate } from 'react-router-dom';

const GithubIcon = ({ size = 24, color = "currentColor" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0-.1-3.8s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0C6.2 1.5 5 1.9 5 1.9a5.5 5.5 0 0 0-.1 3.8A5.5 5.5 0 0 0 3.4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
  </svg>
);

export const Login = () => {
  const { login, token, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  // Show nothing while auth is being validated to avoid login page flash
  if (loading) {
    return null;
  }

  // Only redirect if token is valid AND user is confirmed by backend
  if (token && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            background: 'var(--accent-blue)', 
            width: '64px', height: '64px', 
            borderRadius: '16px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 4px 20px rgba(10, 132, 255, 0.4)'
          }}>
            <GithubIcon color="white" size={32} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '0.5rem' }}>Repo Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Practical test repository lifecycle management.
          </p>
        </div>

        {error && (
          <div className="glass-panel" style={{ background: 'rgba(255, 69, 58, 0.1)', borderColor: 'rgba(255, 69, 58, 0.3)', color: 'var(--accent-red)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <button onClick={login} className="glass-button primary" style={{ width: '100%', justifyContent: 'center' }}>
          <GithubIcon size={20} />
          Continue with GitHub
        </button>
      </div>
    </div>
  );
};
