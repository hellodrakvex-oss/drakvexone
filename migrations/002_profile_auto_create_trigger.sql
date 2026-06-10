-- ============================================================================
-- MIGRATION 002: Auto-create profile via auth.users trigger
-- ============================================================================
-- Eliminates the signup race condition where auth.uid() is not yet available
-- in the client session when the profile INSERT fires.
--
-- The trigger runs inside the same transaction as the auth.users INSERT,
-- using SECURITY DEFINER to bypass RLS. The profile row is guaranteed to
-- exist by the time supabase.auth.signUp() returns to the client.
-- ============================================================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, language, theme, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.email, ''),
    'en',
    'dark',
    'INR'
  );
  RETURN NEW;
END;
$$;

-- 2. Drop the trigger if it already exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Notes:
-- * SECURITY DEFINER means this function runs as the DB owner, bypassing RLS.
-- * SET search_path = public prevents search_path hijacking (security best practice).
-- * COALESCE(phone, email, '') handles both phone-auth and email-auth signups.
-- * The client-side INSERT policy on profiles is kept as a safety net but is
--   no longer the primary profile-creation path.
-- ============================================================================
