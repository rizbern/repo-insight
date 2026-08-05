import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:3000/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(sessionStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // When token changes, persist it and validate with backend
  useEffect(() => {
    if (token) {
      sessionStorage.setItem('token', token);
      // Mark as loading while we validate the new token
      setLoading(true);
      validateAndFetchUser(token);
    } else {
      sessionStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const validateAndFetchUser = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setSessionExpired(false);
      } else {
        sessionStorage.removeItem('token');
        setSessionExpired(true);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      sessionStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Silently re-validate the current token against the backend.
   * Called on route changes and window focus to detect revoked sessions.
   */
  const revalidate = useCallback(async () => {
    const currentToken = sessionStorage.getItem('token');
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      if (!res.ok) {
        sessionStorage.removeItem('token');
        setSessionExpired(true);
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Revalidation failed:', err);
      sessionStorage.removeItem('token');
      setUser(null);
      setToken(null);
    }
  }, []);

  /**
   * Auth-aware fetch wrapper. Auto-detects 401 and clears session.
   */
  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      sessionStorage.removeItem('token');
      setSessionExpired(true);
      setUser(null);
      setToken(null);
    }

    return res;
  }, [token]);

  const login = useCallback(() => {
    window.location.href = `${API_BASE}/auth/github`;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setUser(null);
    setSessionExpired(false);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      token, setToken, user, loading,
      sessionExpired, setSessionExpired,
      login, logout, authFetch, revalidate
    }}>
      {children}
    </AuthContext.Provider>
  );
};
