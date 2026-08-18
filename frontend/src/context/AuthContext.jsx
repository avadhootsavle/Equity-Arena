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
        console.log('[Auth] No session token found in localStorage. User unauthenticated.');
        if (isMounted) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      console.log('[Auth] Found session token in localStorage. Validating with backend (GET /auth/me)...');

      try {
        const data = await apiFetch('/auth/me');
        if (isMounted && data?.user) {
          console.log(`[Auth] Session token validated successfully. User: ${data.user.email} (Role: ${data.user.role})`);
          setUser(data.user);
          localStorage.setItem('ignite_user', JSON.stringify(data.user));
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[Auth] Session token validation failed (clearing stale token):', err.message);
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
      console.warn('[Auth] Received auth:unauthorized event. Resetting auth state...');
      if (isMounted) {
        setToken(null);
        setUser(null);
        setLoading(false);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === 'ignite_token' || e.key === 'ignite_user') {
        console.log(`[Auth] localStorage key '${e.key}' changed in another tab. Syncing auth state...`);
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
    console.log(`[Auth] User logged in: ${newUser.email} (Role: ${newUser.role}). Storing token in localStorage.`);
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('ignite_token', newToken);
    localStorage.setItem('ignite_user', JSON.stringify(newUser));
  };

  const logout = () => {
    console.log('[Auth] User logging out. Clearing token from localStorage.');
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
