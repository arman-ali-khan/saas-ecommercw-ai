-- 1. Security Fix for trigger_set_timestamp function
-- This prevents "Search Path Hijacking" attacks
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- 2. Security Fix for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- 3. Add subscription_end_date to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'subscription_end_date') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
    END IF;
END $$;

-- 4. Add duration columns to plans if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'plans' AND column_name = 'duration_value') THEN
        ALTER TABLE public.plans ADD COLUMN duration_value INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'plans' AND column_name = 'duration_unit') THEN
        ALTER TABLE public.plans ADD COLUMN duration_unit TEXT DEFAULT 'month' CHECK (duration_unit IN ('month', 'year'));
    END IF;
END $$;

-- 5. Optimize RLS Policies for performance and fix UUID/TEXT comparison issues
-- We use (select auth.uid())::text to handle cases where ID columns might be TEXT instead of UUID

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
USING (id::text = (SELECT auth.uid())::text);

-- Subscription Payments Table
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can insert their own subscription payments"
ON public.subscription_payments FOR INSERT
WITH CHECK (user_id::text = (SELECT auth.uid())::text);

DROP POLICY IF EXISTS "Users can view their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can view their own subscription payments"
ON public.subscription_payments FOR SELECT
USING (user_id::text = (SELECT auth.uid())::text);

-- Customer Addresses Table
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage their own addresses"
ON public.customer_addresses FOR ALL
USING (customer_id::text = (SELECT auth.uid())::text);

-- Live Chat Messages Table
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view messages for their site" ON public.live_chat_messages;
CREATE POLICY "Admins can view messages for their site"
ON public.live_chat_messages FOR SELECT
USING (site_id::text = (SELECT auth.uid())::text);

-- Carousel Slides Table
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage carousel slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage carousel slides"
ON public.carousel_slides FOR ALL
USING (site_id::text = (SELECT auth.uid())::text);

-- SaaS Reviews (Safe INSERT)
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review"
ON public.saas_reviews FOR INSERT
WITH CHECK (name IS NOT NULL AND review_text IS NOT NULL);

-- Uncompleted Orders Table (Secure Access)
-- Only allow access via Service Role/Admin API by disabling public RLS bypass
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;