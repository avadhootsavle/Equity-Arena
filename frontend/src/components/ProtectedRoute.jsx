import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, allowedRole, requiredRole }) {
  const { isAuthenticated, user, token, loading } = useAuth();
  const location = useLocation();

  const roleToEnforce = allowedRole || requiredRole;

  if (loading) {
    console.log(`[Auth Guard] Path '${location.pathname}' waiting on session validation (loading = true)...`);
    return (
      <div className="min-h-screen theme-bg-main flex flex-col items-center justify-center space-y-4 select-none">
        <div className="w-10 h-10 border-4 border-[#D4A017] border-t-transparent rounded-full animate-spin shadow-lg" />
        <div className="text-xs font-mono font-bold theme-text-muted tracking-wider uppercase">
          Authenticating terminal session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token || !user) {
    console.warn(`[Auth Guard] Access denied to '${location.pathname}'. Unauthenticated user. Redirecting to /login.`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roleToEnforce && user?.role !== roleToEnforce) {
    console.warn(`[Auth Guard] Role mismatch for '${location.pathname}' (Required: ${roleToEnforce}, Actual: ${user?.role}). Redirecting to role home.`);
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/trader" replace />;
    }
  }

  console.log(`[Auth Guard] Access granted to '${location.pathname}' for user: ${user.email} (Role: ${user.role})`);
  return children;
}
