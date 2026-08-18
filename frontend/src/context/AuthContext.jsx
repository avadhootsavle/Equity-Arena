import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('ignite_token') || null;
    } catch (e) {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ignite_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      localStorage.removeItem('ignite_user');
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Validate stored JWT token with backend on initial load / page refresh
  useEffect(() => {
    let isMounted = true;

    async function validateAuthToken() {
      const storedToken = localStorage.getItem('ignite_token');
      if (!storedToken) {
        if (isMounted) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await apiFetch('/auth/me');
        if (isMounted && data?.user) {
          setUser(data.user);
          localStorage.setItem('ignite_user', JSON.stringify(data.user));
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[AuthContext] Session token invalid or expired:', err.message);
          setToken(null);
          setUser(null);
          localStorage.removeItem('ignite_token');
          localStorage.removeItem('ignite_user');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    validateAuthToken();

    const handleUnauthorized = () => {
      if (isMounted) {
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'ignite_token' || e.key === 'ignite_user') {
        const freshToken = localStorage.getItem('ignite_token');
        const freshUserRaw = localStorage.getItem('ignite_user');
        if (!freshToken || !freshUserRaw) {
          if (isMounted) {
            setToken(null);
            setUser(null);
            setLoading(false);
          }
        } else {
          try {
            const freshUser = JSON.parse(freshUserRaw);
            if (isMounted) {
              setToken(freshToken);
              setUser(freshUser);
              setLoading(false);
            }
          } catch (err) {
            if (isMounted) {
              setToken(null);
              setUser(null);
              setLoading(false);
            }
          }
        }
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('ignite_token', newToken);
    localStorage.setItem('ignite_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ignite_token');
    localStorage.removeItem('ignite_user');
  };

  const value = {
    token,
    user,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'ADMIN',
    isTrader: user?.role === 'TRADER',
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
