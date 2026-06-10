-- Phase 2.6 Database Schema Changes: Due Ledger (Partial Payments)

-- 1. Create due_payments table
CREATE TABLE IF NOT EXISTS public.due_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    due_id UUID NOT NULL REFERENCES public.customer_dues(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    notes TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for due_payments
ALTER TABLE public.due_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own due payments" 
    ON public.due_payments FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own due payments" 
    ON public.due_payments FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own due payments" 
    ON public.due_payments FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own due payments" 
    ON public.due_payments FOR DELETE 
    USING (auth.uid() = user_id);

-- 2. Enhance customer_dues table
ALTER TABLE public.customer_dues ADD COLUMN IF NOT EXISTS paid_amount NUMERIC NOT NULL DEFAULT 0;

-- 3. Database Trigger to Auto-Compute Balance and Status
CREATE OR REPLACE FUNCTION public.update_due_paid_amount()
RETURNS TRIGGER AS $$
DECLARE
    total_paid NUMERIC;
    due_total NUMERIC;
BEGIN
    -- Calculate total payments for the due
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM public.due_payments
    WHERE due_id = COALESCE(NEW.due_id, OLD.due_id);

    -- Get original due amount
    SELECT amount INTO due_total
    FROM public.customer_dues
    WHERE id = COALESCE(NEW.due_id, OLD.due_id);

    -- Update the paid_amount and status based on the total_paid
    UPDATE public.customer_dues
    SET paid_amount = total_paid,
        status = CASE WHEN total_paid >= due_total THEN 'paid' ELSE 'pending' END,
        paid_at = CASE WHEN total_paid >= due_total THEN now() ELSE NULL END
    WHERE id = COALESCE(NEW.due_id, OLD.due_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for INSERT, UPDATE, DELETE on due_payments
DROP TRIGGER IF EXISTS on_due_payment_change ON public.due_payments;
CREATE TRIGGER on_due_payment_change
AFTER INSERT OR UPDATE OR DELETE ON public.due_payments
FOR EACH ROW EXECUTE FUNCTION public.update_due_paid_amount();

-- 4. Data Migration (Backfill existing paid dues)
-- Create a single payment record matching the total amount for dues that are already 'paid'
INSERT INTO public.due_payments (user_id, due_id, amount, payment_date, created_at)
SELECT user_id, id, amount, COALESCE(paid_at, updated_at, created_at), COALESCE(paid_at, updated_at, created_at)
FROM public.customer_dues
WHERE status = 'paid'
ON CONFLICT DO NOTHING;

-- Update paid_amount for the backfilled rows to match the trigger logic manually
UPDATE public.customer_dues
SET paid_amount = amount
WHERE status = 'paid';
