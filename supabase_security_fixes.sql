
-- Supabase Security & Performance Fixes Script
-- This script fixes RLS policies, function security, and adds necessary subscription columns.
-- You can run this multiple times safely.

-- 1. ADD NECESSARY COLUMNS FOR SUBSCRIPTION MANAGEMENT
-- Add subscription_end_date to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='subscription_end_date') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
    END IF;
END $$;

-- Add duration columns to plans if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='plans' AND COLUMN_NAME='duration_value') THEN
        ALTER TABLE public.plans ADD COLUMN duration_value INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='plans' AND COLUMN_NAME='duration_unit') THEN
        ALTER TABLE public.plans ADD COLUMN duration_unit TEXT DEFAULT 'month' CHECK (duration_unit IN ('month', 'year'));
    END IF;
END $$;


-- 2. FIX FUNCTION SECURITY (Search Path Hijacking Prevention)
-- Update the update_updated_at_column function to have a secure search_path
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;


-- 3. OPTIMIZE RLS POLICIES FOR PERFORMANCE AND TYPE SAFETY
-- We use (SELECT auth.uid())::text to prevent re-evaluation for every row and fix UUID vs TEXT mismatch.

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
ON public.profiles
FOR UPDATE
USING (id::text = (SELECT auth.uid())::text);

-- Subscription Payments Table
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can insert their own subscription payments"
ON public.subscription_payments
FOR INSERT
WITH CHECK (user_id::text = (SELECT auth.uid())::text);

-- Customer Addresses Table
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage their own addresses"
ON public.customer_addresses
FOR ALL
USING (customer_id::text = (SELECT auth.uid())::text);

-- Live Chat Messages Table
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage their site's messages" ON public.live_chat_messages;
CREATE POLICY "Admins can manage their site's messages"
ON public.live_chat_messages
FOR ALL
USING (site_id::text = (SELECT auth.uid())::text);

-- Carousel Slides Table
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage their slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage their slides"
ON public.carousel_slides
FOR ALL
USING (site_id::text = (SELECT auth.uid())::text);

-- Uncompleted Orders Table (Security Fix)
-- Remove overly permissive UPDATE policy and add secure one for admins
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Admins can view uncompleted orders" ON public.uncompleted_orders;
CREATE POLICY "Admins can view uncompleted orders"
ON public.uncompleted_orders
FOR SELECT
USING (site_id::text = (SELECT auth.uid())::text);

-- SaaS Reviews Table (Security Fix)
-- Prevent security bypass by adding basic validation instead of true
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review"
ON public.saas_reviews
FOR INSERT
WITH CHECK (name <> '' AND review_text <> '');


-- 4. PERFORMANCE INDEXES
-- Add indexes to improve lookups for common filter/search operations
CREATE INDEX IF NOT EXISTS idx_profiles_domain ON public.profiles(domain);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_orders_site_id ON public.orders(site_id);
CREATE INDEX IF NOT EXISTS idx_products_site_id ON public.products(site_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);

GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.plans TO postgres, service_role;
