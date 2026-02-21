-- ==============================================================================
-- SUPABASE SECURITY & PERFORMANCE FIXES
-- This script fixes RLS issues, mutable search paths, and re-evaluation performance.
-- Use this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. FIX: RECURSIVE AUTH FUNCTIONS (Performance Optimization)
-- Replaces auth.uid() with (select auth.uid()) to prevent row-by-row re-evaluation.

-- Profiles Table
DROP POLICY IF EXISTS "Users can update their own profile." ON profiles;
CREATE POLICY "Users can update their own profile." 
ON profiles FOR UPDATE 
USING (id = (select auth.uid()))
WITH CHECK (id = (select auth.uid()));

-- Subscription Payments
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON subscription_payments;
CREATE POLICY "Users can insert their own subscription payments" 
ON subscription_payments FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

-- Carousel Slides
DROP POLICY IF EXISTS "Admins can manage their own slides" ON carousel_slides;
CREATE POLICY "Admins can manage their own slides" 
ON carousel_slides FOR ALL 
USING (site_id = (select auth.uid()))
WITH CHECK (site_id = (select auth.uid()));

-- 2. FIX: OVERLY PERMISSIVE POLICIES (Security Fixes)

-- Live Chat Messages (Bypass unrestricted access)
DROP POLICY IF EXISTS "Admins can manage messages" ON live_chat_messages;
CREATE POLICY "Admins can manage messages" 
ON live_chat_messages FOR ALL 
USING (site_id = (select auth.uid()))
WITH CHECK (site_id = (select auth.uid()));

-- SaaS Reviews (Anyone can submit, but with validation)
DROP POLICY IF EXISTS "Anyone can submit a review" ON saas_reviews;
CREATE POLICY "Anyone can submit a review" 
ON saas_reviews FOR INSERT 
WITH CHECK (
    length(name) > 1 AND 
    length(review_text) > 10
);

-- Customer Addresses (Privacy Protection)
-- We rely on API Service Role for management, so we lock public access.
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON customer_addresses;
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON customer_addresses;
CREATE POLICY "Customers can manage their own addresses" 
ON customer_addresses FOR ALL 
USING (customer_id = (select auth.uid()))
WITH CHECK (customer_id = (select auth.uid()));

-- 3. FIX: UNCOMPLETED ORDERS (Prevent Data Tampering)
ALTER TABLE uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON uncompleted_orders;
-- Note: These tables are managed by Edge Functions / Admin Keys usually.
-- If customer access is needed, use: USING (id::text = current_setting('request.headers')::json->>'x-session-id')

-- 4. FIX: MUTABLE SEARCH PATH (Function Security)

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

-- 5. ENSURE RLS IS ENABLED ON ALL SENSITIVE TABLES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE carousel_slides ENABLE ROW LEVEL SECURITY;

-- Success Message
SELECT 'Security and performance fixes applied successfully!' as result;
