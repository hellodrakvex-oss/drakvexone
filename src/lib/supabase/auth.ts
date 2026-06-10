import { supabase } from './client';
import type { AuthUser, Profile } from './types';

/**
 * Fetch a user's profile, retrying briefly if the trigger hasn't committed yet.
 * The profile is auto-created by a database trigger on auth.users, so it should
 * always exist by the time signUp/signIn returns — but a short retry handles
 * any edge-case propagation delay.
 */
async function fetchProfileWithRetry(
  userId: string,
  maxRetries = 3,
  delayMs = 500
): Promise<Profile | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(`[Auth] Profile fetch attempt ${attempt + 1} error:`, error);
    }

    if (data) return data;

    // Wait before retrying (skip wait on last attempt)
    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return null;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<{ user: AuthUser; profile: Profile | null }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });


    if (error) {
      console.error('[Auth] Sign up failed:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user data returned from Supabase after sign up');
    }

    if (!data.session) {
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (signInResult.error) {
        console.error('[Auth] Manual sign in after sign up failed:', signInResult.error);
        // Do not throw here so user object is still returned and flow continues to verify email screen if needed
      }
    }

    const { data: { session } } = await supabase.auth.getSession();

    // Profile is auto-created by the on_auth_user_created trigger.
    // Just fetch it (with retry for any propagation edge case).
    const profile = await fetchProfileWithRetry(data.user.id);

    return {
      user: {
        id: data.user.id,
        email: data.user.email || email,
        profile: profile || undefined,
      },
      profile,
    };
  } catch (error) {
    console.error('[Auth] Sign up exception:', error);
    throw error;
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ user: AuthUser; profile: Profile | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Sign in failed:', error);
      throw error;
    }

    if (!data.user) {
      throw new Error('No user data returned from Supabase after sign in');
    }

    // Profile should already exist (created by trigger on first signup).
    // Fetch with retry as a safety measure.
    const profile = await fetchProfileWithRetry(data.user.id);

    return {
      user: {
        id: data.user.id,
        email: data.user.email || email,
        profile: profile || undefined,
      },
      profile,
    };
  } catch (error) {
    console.error('[Auth] Sign in exception:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPasswordForEmail(email: string): Promise<void> {
  try {
    // Log localStorage before reset
//       localStorageKeys: Object.keys(localStorage),
//     });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Log localStorage after reset
//       localStorageKeys: Object.keys(localStorage),
//     });

    if (error) {
      console.error('[Auth] Reset password failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Auth] Reset password exception:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updatePassword(password: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error('[Auth] Update password failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('[Auth] Update password exception:', error);
    throw error;
  }
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();


    return {
      id: user.id,
      email: user.email || '',
      profile: profile || undefined,
    };
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Failed to sign out:', error);
    throw error;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Failed to check authentication:', error);
    return false;
  }
}

/**
 * Update user profile (shop_name, language, theme, etc.)
 */
export async function updateProfile(
  userId: string,
  updates: Record<string, any>
): Promise<Profile> {
  try {
    const payload = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    

    const {
      data: { user }
    } = await supabase.auth.getUser();


    if (!user) {
      throw new Error("No authenticated user");
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .maybeSingle();


    if (error) {
      console.error(
        "PROFILE UPDATE ERROR",
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}

/**
 * Create initial shop for new user
 */
export async function createInitialShop(
  userId: string,
  shopData: {
    shop_name: string;
    address?: string;
    city?: string;
    phone: string;
  }
): Promise<string> {
  try {
    const payload = {
      user_id: userId,
      ...shopData,
    };
    

    const { data, error } = await supabase
      .from('shops')
      .insert(payload)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[createInitialShop] Supabase error:', {
        code: error.code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        status: (error as any).status,
        raw: JSON.stringify(error),
      });
      throw new Error(`Shop creation failed: ${error.message} (code: ${error.code})`);
    }
    if (!data) throw new Error('No shop returned after insert');
    return data.id;
  } catch (error: any) {
    console.error('[createInitialShop] Exception:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack,
    });
    throw error;
  }
}

/**
 * Get user's shop (usually first/only shop)
 */
export async function getUserShop(userId: string) {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();


    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to get user shop:', error);
    throw error;
  }
}

/**
 * Sign up or sign in user with email OTP
 * Returns true if OTP was sent successfully
 * 
 * Detailed logging:
 * - Logs when OTP send request starts
 * - Logs success with email address
 * - Logs specific error types (network, rate limit, etc.)
 */
export async function sendEmailOTP(email: string): Promise<boolean> {
  try {

    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      console.error(`[OTP] Failed to send OTP to ${email}:`, {
        code: error.status || 'unknown',
        message: error.message,
        error,
      });

      // Specific error handling
      if (error.status === 429 || error.message?.includes('rate')) {
        const rateLimitError = new Error(
          'Too many OTP requests. Please wait a few minutes before trying again.'
        );
        rateLimitError.name = 'RateLimitError';
        throw rateLimitError;
      }

      if (error.status === 0 || error.message?.includes('network') || error.message?.includes('fetch')) {
        const networkError = new Error(
          'Network error. Please check your internet connection and try again.'
        );
        networkError.name = 'NetworkError';
        throw networkError;
      }

      throw error;
    }

    return true;
  } catch (error: any) {
    console.error('[OTP] Send OTP exception:', {
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      originalError: error,
    });
    throw error;
  }
}

/**
 * Verify OTP and create/update user session
 * 
 * Detailed logging:
 * - Logs when verification starts
 * - Logs if OTP is expired (token is no longer valid)
 * - Logs if OTP is invalid (wrong token)
 * - Logs network errors during verification
 * - Always uses the latest generated OTP (managed by Supabase)
 * 
 * Note: Supabase automatically invalidates previous OTPs when a new one is generated,
 * ensuring only the latest OTP is valid
 */
export async function verifyEmailOTP(
  email: string,
  token: string
): Promise<{ user: AuthUser; profile: Profile | null }> {
  try {

    if (!token || token.trim().length === 0) {
      const validationError = new Error('OTP code is required');
      validationError.name = 'ValidationError';
      console.error('[OTP] Validation failed: empty token', { email });
      throw validationError;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      console.error(`[OTP] Verification failed for ${email}:`, {
        code: error.status || 'unknown',
        message: error.message,
        error,
      });

      // Specific error handling for different failure modes
      if (error.message?.includes('invalid') || error.message?.includes('Invalid')) {
        const invalidError = new Error(
          'Invalid OTP. Please double-check the 4-digit code and try again.'
        );
        invalidError.name = 'InvalidOTPError';
        throw invalidError;
      }

      if (error.message?.includes('expired') || error.message?.includes('Expired')) {
        const expiredError = new Error(
          'OTP has expired. Please request a new OTP.'
        );
        expiredError.name = 'ExpiredOTPError';
        throw expiredError;
      }

      if (error.status === 0 || error.message?.includes('network') || error.message?.includes('fetch')) {
        const networkError = new Error(
          'Network error during verification. Please check your connection and try again.'
        );
        networkError.name = 'NetworkError';
        console.error('[OTP] Network error during verification:', { email });
        throw networkError;
      }

      // Generic error
      const genericError = new Error(
        error.message || 'Failed to verify OTP. Please try again.'
      );
      genericError.name = 'VerificationError';
      throw genericError;
    }

    if (!data.user) {
      const noUserError = new Error('No user data returned from Supabase after OTP verification');
      console.error('[OTP] No user returned after successful verification:', { email });
      throw noUserError;
    }


    // Fetch or create profile
    let profile: Profile | null = null;
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[OTP] Error fetching profile:', {
        userId: data.user.id,
        error: profileError,
      });
      throw profileError;
    }

    if (!existingProfile) {
      // First-time user - create profile with email
      
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          phone: data.user.email || email,
          language: 'en',
          currency: 'INR',
        })
        .select()
        .single();

      if (createError) {
        console.error('[OTP] Failed to create profile:', {
          userId: data.user.id,
          error: createError,
        });
        throw createError;
      }
      
      profile = newProfile || null;
    } else {
      profile = existingProfile || null;
    }


    return {
      user: {
        id: data.user.id,
        email: data.user.email || email,
        profile: profile || undefined,
      },
      profile,
    };
  } catch (error: any) {
    console.error('[OTP] Verify OTP exception:', {
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: error?.stack,
      email,
      originalError: error,
    });
    throw error;
  }
}

/**
 * Ensure user has all required setup records (profile, shop, settings)
 * Idempotent: safe to call multiple times without creating duplicates
 * 
 * This is called on app startup and after login to guarantee every user has:
 * - Profile record (required for all features)
 * - Shop record (required for sales, expenses, dues)
 * - Settings record (required for preferences)
 * 
 * Logs what was created so admins can track onboarding success
 */
export async function ensureUserSetup(userId: string): Promise<{
  profileCreated: boolean;
  shopCreated: boolean;
  settingsCreated: boolean;
}> {
  try {
    
    const results = {
      profileCreated: false,
      shopCreated: false,
      settingsCreated: false,
    };

    // 1. Ensure profile exists
    try {
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (checkError) {
        console.error(`[Setup] Error checking profile for ${userId}:`, checkError);
      }

      if (!existingProfile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            phone: '',
            language: 'en',
            currency: 'INR',
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Setup] Failed to create profile for ${userId}:`, insertError);
          // Don't throw - continue with other setup steps
        } else {
          results.profileCreated = true;
        }
      } else {
      }
    } catch (error) {
      console.error(`[Setup] Exception checking/creating profile for ${userId}:`, error);
    }

    // 2. Ensure shop exists
    try {
      const { data: existingShop, error: checkError } = await supabase
        .from('shops')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error(`[Setup] Error checking shop for ${userId}:`, checkError);
      }

      if (!existingShop) {
        const { data: newShop, error: insertError } = await supabase
          .from('shops')
          .insert({
            user_id: userId,
            shop_name: 'My Shop',
            phone: '',
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Setup] Failed to create shop for ${userId}:`, insertError);
          // Don't throw - continue with other setup steps
        } else {
          results.shopCreated = true;
        }
      } else {
      }
    } catch (error) {
      console.error(`[Setup] Exception checking/creating shop for ${userId}:`, error);
    }

    // 3. Ensure settings exists
    try {
      const { data: existingSettings, error: checkError } = await supabase
        .from('settings')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error(`[Setup] Error checking settings for ${userId}:`, checkError);
      }

      if (!existingSettings) {
        const { data: newSettings, error: insertError } = await supabase
          .from('settings')
          .insert({
            user_id: userId,
            language: 'en',
            notifications_enabled: true,
            whatsapp_enabled: true,
            currency: 'INR',
          })
          .select()
          .single();

        if (insertError) {
          console.error(`[Setup] Failed to create settings for ${userId}:`, insertError);
          // Don't throw - continue
        } else {
          results.settingsCreated = true;
        }
      } else {
      }
    } catch (error) {
      console.error(`[Setup] Exception checking/creating settings for ${userId}:`, error);
    }

    // Log summary
    const created = [
      results.profileCreated && 'profile',
      results.shopCreated && 'shop',
      results.settingsCreated && 'settings',
    ].filter(Boolean);

    if (created.length > 0) {
    } else {
    }

    return results;
  } catch (error) {
    console.error(`[Setup] Unexpected error during setup for ${userId}:`, error);
    return {
      profileCreated: false,
      shopCreated: false,
      settingsCreated: false,
    };
  }
}
