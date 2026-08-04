import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Welcome, {user?.githubUsername || 'User'}
          </p>
        </div>
        <button onClick={logout} className="glass-button">
          Logout
        </button>
      </header>

      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>The Dashboard table is not built yet!</p>
      </div>
    </div>
  );
};
