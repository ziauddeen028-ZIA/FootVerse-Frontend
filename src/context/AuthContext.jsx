import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const ROLES = {
  GUEST: 'guest',
  PLAYER: 'player',
  TEAM_MANAGER: 'team_manager',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  guest: 'Guest Visitor',
  player: 'Pro Player',
  team_manager: 'Team Manager',
  organizer: 'Tournament Organizer',
  admin: 'Platform Admin',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve the active role from (in priority order):
 *   1. The profile row from public.profiles
 *   2. The raw_user_meta_data embedded in the Supabase auth user object
 *   3. Fall back to PLAYER for any authenticated user
 */
function resolveRole(user, profile) {
  return (
    profile?.role ||
    user?.user_metadata?.role ||
    ROLES.PLAYER
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeRole, setActiveRole] = useState(ROLES.GUEST);
  const [loading, setLoading] = useState(true);

  // Apply a resolved auth session to React state
  const applySession = (authUser, authProfile) => {
    if (authUser) {
      setUser(authUser);
      setProfile(authProfile ?? null);
      setActiveRole(resolveRole(authUser, authProfile));
    } else {
      setUser(null);
      setProfile(null);
      setActiveRole(ROLES.GUEST);
    }
  };

  // ─── Real-time Supabase Auth State Listener ──────────────────────────────────
  // onAuthStateChange fires immediately on mount with the current session
  // (INITIAL_SESSION event), so we use it as the single source of truth.
  //
  // KEY FIX: We gate on `session?.user` only — NOT on `session?.profile`.
  // Profile can be null due to trigger timing or a transient fetch error;
  // that must never cause an authenticated user to appear as a guest.
  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((session) => {
      applySession(session?.user ?? null, session?.profile ?? null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ─── Auth Actions ─────────────────────────────────────────────────────────────

  /**
   * Sign in. Eagerly applies state from the service response so the UI
   * updates immediately rather than waiting for onAuthStateChange to fire.
   */
  const login = async ({ email, password }) => {
    const session = await authService.login({ email, password });
    // Eagerly sync — onAuthStateChange will fire shortly and confirm the same state
    applySession(session.user, session.profile);
    return session;
  };

  /**
   * Register. Same pattern: eagerly apply returned session to state.
   */
  const register = async ({ email, password, fullName, role, preferredPosition }) => {
    const session = await authService.register({
      email,
      password,
      fullName,
      role,
      preferredPosition,
    });
    applySession(session.user, session.profile);
    return session;
  };

  const forgotPassword = async ({ email }) => {
    return await authService.forgotPassword({ email });
  };

  const logout = async () => {
    await authService.logout();
    // onAuthStateChange fires SIGNED_OUT and clears state via applySession(null, null)
  };

  // Development-only role preview switcher (does not affect the Supabase session)
  const switchDevRole = (role) => {
    setActiveRole(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeRole,
        loading,
        login,
        register,
        forgotPassword,
        logout,
        signOut: logout,
        switchDevRole,
        isAuthenticated: Boolean(user) && activeRole !== ROLES.GUEST,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
