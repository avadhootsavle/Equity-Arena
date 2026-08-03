import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { TraderDashboard } from './pages/TraderDashboard';

// Protected Route Guard for authenticated users
function ProtectedRoute({ children, requiredRole }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen theme-bg-main flex items-center justify-center theme-text-muted text-xs font-mono font-bold">
        Authenticating session...
      </div>
    );
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/trader'} replace />;
  }

  return children;
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                {/* Single Unified Login Page for Everyone */}
                <Route path="/login" element={<Login />} />

                {/* Admin Dashboard */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Trader Dashboard */}
                <Route
                  path="/trader"
                  element={
                    <ProtectedRoute requiredRole="TRADER">
                      <TraderDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Default Route Fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
