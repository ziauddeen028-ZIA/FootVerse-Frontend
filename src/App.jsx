import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { OrganizerLayout } from './components/layout/OrganizerLayout';
import { ScrollToTop } from './components/common/ScrollToTop';

// Auth guards
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';

// Public Pages
import { HomePage } from './pages/HomePage';
import { DashboardShell } from './pages/DashboardShell';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { UnauthorizedPage } from './pages/auth/UnauthorizedPage';
import { ModulePreviewPage } from './pages/ModulePreviewPage';
import { StatsHub } from './pages/StatsHub';
import { TournamentHub } from './pages/TournamentHub';

// Organizer Pages
import { Dashboard as OrganizerDashboard } from './pages/organizer/Dashboard';
import { Tournaments as OrganizerTournaments } from './pages/organizer/Tournaments';
import { Teams as OrganizerTeams } from './pages/organizer/Teams';
import { Matches as OrganizerMatches } from './pages/organizer/Matches';
import { Players as OrganizerPlayers } from './pages/organizer/Players';
import { LiveMatch } from './pages/organizer/LiveMatch';

function AppContent() {
  const { loading } = useAuth();

  // Show full loading screen while restoring initial session
  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Routes>
      {/* ─── Organizer Section ─────────────────────────────────────────────
          All /organizer/* routes are nested under OrganizerLayout.
          The ProtectedRoute guard on the parent propagates to all children.
      ──────────────────────────────────────────────────────────────────── */}
      <Route
        element={
          <ProtectedRoute allowedRoles={['organizer']}>
            <OrganizerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/organizer" index element={<OrganizerDashboard />} />
        <Route path="/organizer/tournaments" element={<OrganizerTournaments />} />
        <Route path="/organizer/teams" element={<OrganizerTeams />} />
        <Route path="/organizer/players" element={<OrganizerPlayers />} />
        <Route path="/organizer/matches" element={<OrganizerMatches />} />
        <Route path="/organizer/matches/:matchId/live" element={<LiveMatch />} />
      </Route>

      {/* ─── Public Section ────────────────────────────────────────────────
          All remaining routes use PublicLayout.
      ──────────────────────────────────────────────────────────────────── */}
      <Route element={<PublicLayout />}>
        {/* Public Ecosystem Routes (Guests & Users can browse freely) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<HomePage />} />

        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Public Ecosystem Pages & Functional Routes */}
        <Route path="/tournaments" element={<HomePage />} />
        <Route path="/tournaments/:tournamentId" element={<TournamentHub />} />
        <Route path="/tournaments-preview" element={<HomePage />} />
        <Route path="/matches" element={<HomePage />} />
        <Route path="/matches-preview" element={<HomePage />} />
        <Route path="/teams" element={<StatsHub />} />
        <Route path="/teams-preview" element={<StatsHub />} />
        <Route path="/players" element={<StatsHub />} />
        <Route path="/players-preview" element={<StatsHub />} />
        <Route path="/stats" element={<StatsHub />} />
        <Route path="/stats-preview" element={<StatsHub />} />


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
          path="/notifications"
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
          path="/settings"
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

        {/* Fallback */}
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
