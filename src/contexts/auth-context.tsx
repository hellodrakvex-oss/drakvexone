'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase/client';
import * as authFns from '@/lib/supabase/auth';
import type { AuthUser, Profile } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Record<string, any>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const currentUser = await authFns.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setProfile(currentUser.profile || null);
            // Run setup verification asynchronously so it cannot block the UI
            authFns.ensureUserSetup(currentUser.id).catch(() => {
              // Setup errors are non-fatal; user can retry
            });
          }
        }
      } catch {
        // Session init errors are non-fatal; user will be shown as unauthenticated
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const currentUser = await authFns.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setProfile(currentUser.profile || null);
            authFns.ensureUserSetup(currentUser.id).catch(() => {
              // Non-fatal
            });
          }
        } catch {
          // Non-fatal auth state change error
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { user: authUser, profile: userProfile } = await authFns.signUp(email, password);
      setUser(authUser);
      setProfile(userProfile);
      await authFns.ensureUserSetup(authUser.id);
      toast.success('Account created successfully!');
    } catch (error: any) {
      let userMessage = error?.message || 'Failed to sign up';
      if (error?.message?.includes('already registered')) {
        userMessage = 'This email is already registered.';
      }
      toast.error(userMessage);
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { user: authUser, profile: userProfile } = await authFns.signInWithPassword(
        email,
        password
      );
      setUser(authUser);
      setProfile(userProfile);
      await authFns.ensureUserSetup(authUser.id);
      toast.success('Login successful!');
    } catch (error: any) {
      let userMessage = error?.message || 'Failed to sign in';
      if (error?.message?.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password.';
      }
      toast.error(userMessage);
      throw error;
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      await authFns.resetPasswordForEmail(email);
      toast.success('Password reset link sent to your email.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reset link');
      throw error;
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      await authFns.updatePassword(password);
      toast.success('Password updated successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update password');
      throw error;
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await authFns.signOut();
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign out');
      throw error;
    }
  }, []);

  const updateProfileData = useCallback(
    async (updates: Record<string, any>) => {
      if (!user) throw new Error('No authenticated user');
      try {
        const updated = await authFns.updateProfile(user.id, updates);
        setProfile(updated);
        toast.success('Profile updated');
      } catch (error: any) {
        toast.error(error.message || 'Failed to update profile');
        throw error;
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signUp,
        signIn,
        resetPassword,
        updatePassword,
        signOut: handleSignOut,
        updateProfile: updateProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
