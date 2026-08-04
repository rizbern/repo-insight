import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // When token changes, save it and fetch user profile
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUser(token);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async (authToken) => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // If token is invalid, clear it
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // Redirect to backend OAuth flow
    window.location.href = 'http://localhost:3000/api/auth/github';
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, setToken, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
