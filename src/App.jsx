import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layouts & Guards (loaded synchronously for fast scaffolding)
import { PublicLayout } from './components/layout/PublicLayout';
import { OrganizerLayout } from './components/layout/OrganizerLayout';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthLoadingScreen } from './components/auth/AuthLoadingScreen';
import { LoadingFallback } from './components/common/LoadingFallback';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded Public Pages
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const UnauthorizedPage = lazy(() => import('./pages/auth/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));
const ModulePreviewPage = lazy(() => import('./pages/ModulePreviewPage').then(m => ({ default: m.ModulePreviewPage })));
const StatsHub = lazy(() => import('./pages/StatsHub').then(m => ({ default: m.StatsHub })));
const TournamentHub = lazy(() => import('./pages/TournamentHub').then(m => ({ default: m.TournamentHub })));
const PublicMatchDetail = lazy(() => import('./pages/PublicMatchDetail').then(m => ({ default: m.PublicMatchDetail })));
const PublicTeamDetail = lazy(() => import('./pages/PublicTeamDetail').then(m => ({ default: m.PublicTeamDetail })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const TeamDashboard = lazy(() => import('./pages/TeamDashboard').then(m => ({ default: m.TeamDashboard })));

// Lazy-loaded Organizer Pages (Heavy components loaded on-demand)
const OrganizerDashboard = lazy(() => import('./pages/organizer/Dashboard').then(m => ({ default: m.Dashboard })));
const OrganizerTournaments = lazy(() => import('./pages/organizer/Tournaments').then(m => ({ default: m.Tournaments })));
const OrganizerTeams = lazy(() => import('./pages/organizer/Teams').then(m => ({ default: m.Teams })));
const OrganizerPlayers = lazy(() => import('./pages/organizer/Players').then(m => ({ default: m.Players })));
const OrganizerMatches = lazy(() => import('./pages/organizer/Matches').then(m => ({ default: m.Matches })));
const LiveMatch = lazy(() => import('./pages/organizer/LiveMatch').then(m => ({ default: m.LiveMatch })));

function AppContent() {
  const { loading } = useAuth();

  // Show full loading screen while restoring initial session
  if (loading) {
    return <AuthLoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
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
        <Route path="/my-tournaments" element={<HomePage />} />
        <Route path="/tournaments/:tournamentId" element={<TournamentHub />} />
        <Route path="/tournaments-preview" element={<HomePage />} />
        <Route path="/matches" element={<HomePage />} />
        <Route path="/matches/:matchId" element={<PublicMatchDetail />} />
        <Route path="/matches-preview" element={<HomePage />} />
        <Route path="/teams" element={<StatsHub />} />
        <Route path="/teams/:teamId" element={<PublicTeamDetail />} />
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
              <NotificationsPage />
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
              <TeamDashboard />
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
              <TeamDashboard />
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
    </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <ScrollToTop />
              <AppContent />
            </Router>
          </NotificationProvider>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}
