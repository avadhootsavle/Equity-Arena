import React, { createContext, useContext, useState, useEffect } from 'react';

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

  const [loading, setLoading] = useState(false);

  // Keep state synchronized if token is missing but user exists
  useEffect(() => {
    if (!token && user) {
      setUser(null);
      localStorage.removeItem('ignite_user');
    }
  }, [token, user]);

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
