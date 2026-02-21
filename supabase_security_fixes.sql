-- supabase_security_fixes.sql
-- Run this script in the Supabase SQL Editor to apply security, performance fixes, and schema updates.

-- 1. ADDD COLUMNS FOR SUBSCRIPTION MANAGEMENT
-- Profiles: store end date
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
-- Plans: store duration logic
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS duration_value INTEGER DEFAULT 1;
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS duration_unit TEXT DEFAULT 'month';

-- 2. ENABLE RLS & FIX OVERLY PERMISSIVE POLICIES
-- customer_addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage their own addresses" ON public.customer_addresses
FOR ALL TO authenticated
USING ((select auth.uid()) = customer_id);

-- uncompleted_orders
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;
-- Typically uncompleted orders are handled via Service Role, so no public update/delete needed.

-- saas_reviews (INSERT validation)
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews
FOR INSERT WITH CHECK (
    char_length(name) > 0 AND 
    char_length(review_text) > 10
);

-- 3. PERFORMANCE OPTIMIZATION (Use subqueries for auth.uid())
-- profiles
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE TO authenticated
USING ((select auth.uid()) = id);

-- subscription_payments
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can insert their own subscription payments" ON public.subscription_payments
FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

-- carousel_slides
DROP POLICY IF EXISTS "Admins can manage slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage slides" ON public.carousel_slides
FOR ALL TO authenticated
USING ((select auth.uid()) = site_id);

-- live_chat_messages
DROP POLICY IF EXISTS "Access own messages" ON public.live_chat_messages;
CREATE POLICY "Access own messages" ON public.live_chat_messages
FOR ALL TO authenticated
USING ((select auth.uid()) = site_id OR (select auth.uid()) = sender_id);

-- 4. FUNCTION SECURITY (Set search_path)
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- End of Script