
-- ==========================================
-- 1. SCHEMA UPDATES (Subscription Duration)
-- ==========================================

-- Add subscription_end_date to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Add duration fields to plans
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS duration_value INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'month' CHECK (duration_unit IN ('month', 'year'));

-- ==========================================
-- 2. FUNCTION SECURITY (search_path fix)
-- ==========================================

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- ==========================================
-- 3. RLS PERFORMANCE & SECURITY FIXES
-- ==========================================

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
ON public.profiles
FOR UPDATE
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- Subscription Payments Table
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can insert their own subscription payments"
ON public.subscription_payments
FOR INSERT
WITH CHECK (user_id = (select auth.uid()));

-- Customer Addresses Table
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;
-- We keep this table private because the app uses Service Role via API
-- but we can add a specific policy if direct client access is needed.

-- Uncompleted Orders Table
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;

-- SaaS Reviews Table
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review"
ON public.saas_reviews
FOR INSERT
WITH CHECK (
  name IS NOT NULL AND 
  length(name) > 1 AND 
  review_text IS NOT NULL AND 
  length(review_text) > 10
);

-- Live Chat Table
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view messages for their site" ON public.live_chat_messages;
CREATE POLICY "Admins can view messages for their site"
ON public.live_chat_messages
FOR SELECT
USING (site_id = (select auth.uid()));

-- Carousel Slides Table
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage carousel slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage carousel slides"
ON public.carousel_slides
FOR ALL
USING (site_id = (select auth.uid()))
WITH CHECK (site_id = (select auth.uid()));
