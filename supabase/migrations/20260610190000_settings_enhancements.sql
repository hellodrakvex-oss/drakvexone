-- Phase 2.7C: Settings Page Enhancements

-- 1. Add avatar_url to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Add notification preferences to settings
ALTER TABLE public.settings
ADD COLUMN IF NOT EXISTS push_notifications boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS due_reminders boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_summary boolean DEFAULT true;

-- Update existing rows to have default values if they are null
UPDATE public.settings
SET push_notifications = false WHERE push_notifications IS NULL;

UPDATE public.settings
SET due_reminders = true WHERE due_reminders IS NULL;

UPDATE public.settings
SET daily_summary = true WHERE daily_summary IS NULL;
