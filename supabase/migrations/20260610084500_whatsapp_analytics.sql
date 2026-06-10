-- Migration to create whatsapp_analytics_events and report on legacy null phone records

DO $$ 
DECLARE
  null_phone_count integer;
BEGIN
  SELECT COUNT(*) INTO null_phone_count
  FROM public.customer_dues
  WHERE phone IS NULL OR phone = '';
  
  RAISE NOTICE 'Found % legacy customer dues with null or empty phone numbers.', null_phone_count;
END $$;

CREATE TABLE IF NOT EXISTS public.whatsapp_analytics_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  due_id uuid REFERENCES public.customer_dues(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.whatsapp_analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own analytics events"
  ON public.whatsapp_analytics_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own analytics events"
  ON public.whatsapp_analytics_events
  FOR SELECT
  USING (auth.uid() = user_id);
