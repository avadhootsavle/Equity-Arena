import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { TraderDashboard } from './pages/TraderDashboard';

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
                    <ProtectedRoute allowedRole="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Trader Dashboard */}
                <Route
                  path="/trader"
                  element={
                    <ProtectedRoute allowedRole="TRADER">
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
