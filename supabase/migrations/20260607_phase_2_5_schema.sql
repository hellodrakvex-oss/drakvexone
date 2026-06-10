-- Phase 2.5 Database Schema Changes

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('due_reminder', 'daily_summary', 'expense_alert', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = user_id);

-- 2. Clean up redundant columns
-- We'll leave the columns in profiles for now to avoid breaking existing clients during migration,
-- but we will add the missing owner_name to shops, since that's where business details should live,
-- or we can just use profiles.full_name. Wait, we want profiles to be an auth bridge only.
-- Let's add owner_name to shops if it doesn't exist.

ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Let's make sure settings has theme and language
-- It already does (theme, language, notifications_enabled, whatsapp_enabled, currency)

-- Set up trigger to automatically create a settings row when a user is created if it doesn't exist?
-- It's handled in frontend for now.
