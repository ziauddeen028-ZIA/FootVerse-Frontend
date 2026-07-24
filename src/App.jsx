import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';

import { DashboardShell } from './pages/DashboardShell';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { ModulePreviewPage } from './pages/ModulePreviewPage';

function AppContent() {
  const { loading } = useAuth();

  // Show full loading screen while restoring initial session
  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Permanent Left Sidebar for Desktop */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        
        {/* Top Header Bar */}
        <Header />

        {/* Page Body Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Public Ecosystem Routes (Guests & Users can browse freely) */}
            <Route path="/" element={<DashboardShell />} />
            <Route path="/dashboard" element={<DashboardShell />} />
            
            {/* Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Public Ecosystem Previews */}
            <Route 
              path="/tournaments-preview" 
              element={
                <ModulePreviewPage 
                  title="Tournaments & Cups" 
                  moduleName="Full Tournament Hub, Brackets & Registration" 
                  phaseText="Phase 3" 
                />
              } 
            />
            <Route 
              path="/matches-preview" 
              element={
                <ModulePreviewPage 
                  title="Live Match Center" 
                  moduleName="Real-time Scorecards & Timeline Events" 
                  phaseText="Phase 4" 
                />
              } 
            />
            <Route 
              path="/teams-preview" 
              element={
                <ModulePreviewPage 
                  title="Teams Directory" 
                  moduleName="Roster Management & Club Profiles" 
                  phaseText="Phase 3" 
                />
              } 
            />
            <Route 
              path="/players-preview" 
              element={
                <ModulePreviewPage 
                  title="Player Scouting Hub" 
                  moduleName="Player Cards & Transfer Market" 
                  phaseText="Phase 4" 
                />
              } 
            />
            <Route 
              path="/stats-preview" 
              element={
                <ModulePreviewPage 
                  title="Player & Team Statistics" 
                  moduleName="Golden Boot Leaderboards & Career Cards" 
                  phaseText="Phase 4" 
                />
              } 
            />

            {/* Protected User & Interactive Features */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/notifications-preview" 
              element={
                <ProtectedRoute>
                  <ModulePreviewPage 
                    title="Notifications Center" 
                    moduleName="Alerts, Team Invites & Match Reminders" 
                    phaseText="Phase 3" 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings-preview" 
              element={
                <ProtectedRoute>
                  <ModulePreviewPage 
                    title="Platform Settings" 
                    moduleName="Account Preferences & Security" 
                    phaseText="Phase 3" 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tournaments/create" 
              element={
                <ProtectedRoute>
                  <ModulePreviewPage 
                    title="Host Tournament" 
                    moduleName="Create & Launch New Tournament" 
                    phaseText="Interactive" 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teams/join" 
              element={
                <ProtectedRoute>
                  <ModulePreviewPage 
                    title="Team Registration" 
                    moduleName="Register Squad / Join Team" 
                    phaseText="Interactive" 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/matches-manage" 
              element={
                <ProtectedRoute>
                  <ModulePreviewPage 
                    title="Match Management" 
                    moduleName="Real-time Event Logger" 
                    phaseText="Interactive" 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teams-manage" 
              element={
                <ProtectedRoute>
                  <ModulePreviewPage 
                    title="Team Management" 
                    moduleName="Manage Roster & Club Profile" 
                    phaseText="Interactive" 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ModulePreviewPage 
                    title="Platform Administration" 
                    moduleName="System Oversight & Governance" 
                    phaseText="Admin" 
                  />
                </ProtectedRoute>
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<DashboardShell />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
