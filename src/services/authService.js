// FootVerse Authentication Service
// Wraps Supabase Auth methods and handles profile fetching.
// AuthContext consumes this service – keeping UI and routing untouched.

import { supabase } from '../lib/supabase';

class AuthService {
  /**
   * Fetch the profile row from public.profiles for a given auth user.
   * Returns null if no profile exists yet (e.g. trigger hasn't run).
   */
  async _fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // PGRST116 = row not found – not an error we need to surface
      if (error.code !== 'PGRST116') {
        console.error('[AuthService] Profile fetch error:', error.message);
      }
      return null;
    }
    return data;
  }

  /**
   * Restore the current session from Supabase.
   * Returns { user, profile } or null when not authenticated.
   */
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[AuthService] getSession error:', error.message);
      return null;
    }

    if (!session?.user) return null;

    const profile = await this._fetchProfile(session.user.id);
    return { user: session.user, profile };
  }

  /**
   * Sign in with email and password.
   * Returns { user, profile } on success; throws Error on failure.
   */
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) throw new Error(error.message);

    const profile = await this._fetchProfile(data.user.id);
    return { user: data.user, profile };
  }

  /**
   * Register a new account.
   * Passes full_name, role, and avatar_url into raw_user_meta_data so the
   * Supabase trigger (handle_new_user) can auto-create the profiles row.
   * Returns { user, profile } on success; throws Error on failure.
   */
  async register({ email, password, fullName, role = 'player', preferredPosition = 'Forward' }) {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          role,
          preferred_position: preferredPosition,
          avatar_url: '',
        },
      },
    });

    if (error) throw new Error(error.message);

    // The trigger creates the profile row asynchronously.
    // Poll briefly to give it time, then fall back to returning the metadata.
    let profile = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((r) => setTimeout(r, 600));
      profile = await this._fetchProfile(data.user.id);
      if (profile) break;
    }

    // If the trigger hasn't fired yet, construct a local stand-in from metadata
    if (!profile) {
      profile = {
        id: data.user.id,
        email: cleanEmail,
        full_name: fullName.trim(),
        role,
        preferred_position: preferredPosition,
        avatar_url: '',
      };
    }

    return { user: data.user, profile };
  }

  /**
   * Send a password-reset email.
   * Throws Error on failure.
   */
  async forgotPassword({ email }) {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    if (error) throw new Error(error.message);
    return { success: true, message: `Password reset link sent to ${email.trim().toLowerCase()}.` };
  }

  /**
   * Sign out the current user.
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[AuthService] Logout error:', error.message);
    return true;
  }

  /**
   * Subscribe to Supabase auth state changes.
   * Calls callback({ user, profile }) on SIGNED_IN / TOKEN_REFRESHED,
   * and callback(null) on SIGNED_OUT.
   * Returns the unsubscribe function.
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session?.user) {
          callback(null);
          return;
        }

        // Fetch the profile row for this user
        let profile = await this._fetchProfile(session.user.id);

        // On first sign-up the DB trigger runs asynchronously.
        // If the profile row isn't ready yet, retry a few times.
        if (!profile && event === 'SIGNED_IN') {
          for (let attempt = 0; attempt < 6; attempt++) {
            await new Promise((r) => setTimeout(r, 500));
            profile = await this._fetchProfile(session.user.id);
            if (profile) break;
          }
        }

        callback({ user: session.user, profile });
      }
    );

    return () => subscription.unsubscribe();
  }
}

export const authService = new AuthService();
