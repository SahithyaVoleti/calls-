import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PresenceProvider } from './context/PresenceContext';
import { ChatProvider } from './context/ChatContext';
import { CallProvider } from './context/CallContext';

import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthorized, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Entering TogetherSpace...
        </span>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

// Public Route Guard (Redirects to dashboard if already logged in & authorized)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isAuthorized, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (currentUser && isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PresenceProvider>
          <ChatProvider>
            <CallProvider>
              <BrowserRouter>
                <Routes>
                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/signup"
                    element={
                      <PublicRoute>
                        <SignUpPage />
                      </PublicRoute>
                    }
                  />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Main Protected Route */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </CallProvider>
          </ChatProvider>
        </PresenceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
