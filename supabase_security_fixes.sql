-- Consolidated Supabase Security and Performance Fixes
-- Run this in the Supabase SQL Editor

-- 1. FIX: Function Security (Search Path)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. FIX: Add missing columns if they don't exist
DO $$ 
BEGIN 
    -- Profiles Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_end_date') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
    END IF;

    -- Plans Table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='duration_value') THEN
        ALTER TABLE public.plans ADD COLUMN duration_value INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='duration_unit') THEN
        ALTER TABLE public.plans ADD COLUMN duration_unit TEXT DEFAULT 'month' CHECK (duration_unit IN ('month', 'year'));
    END IF;
END $$;

-- 3. OPTIMIZATION: Performance subqueries for RLS (UUID to TEXT casting handled)
-- Profiles Policy
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE USING (id = (SELECT auth.uid())::uuid);

-- Customer Addresses Policy
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage their own addresses" ON public.customer_addresses
FOR ALL USING (customer_id = (SELECT auth.uid())::uuid OR (SELECT auth.jwt()->>'role') = 'saas_admin');

-- Subscription Payments Policy
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can insert their own subscription payments" ON public.subscription_payments
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid())::uuid);

-- 4. SECURITY: Restrict Uncompleted Orders
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;

-- Only allow service role or admins via API to manage these
CREATE POLICY "Admins can view uncompleted orders" ON public.uncompleted_orders
FOR SELECT USING ((SELECT auth.jwt()->>'role') IN ('admin', 'saas_admin'));

-- 5. SECURITY: SaaS Reviews Validation
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews
FOR INSERT WITH CHECK (
    length(name) > 1 AND 
    length(review_text) > 10
);

-- 6. INDEXES for Dashboard Performance
CREATE INDEX IF NOT EXISTS idx_products_site_id ON public.products(site_id);
CREATE INDEX IF NOT EXISTS idx_orders_site_id ON public.orders(site_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_site_id ON public.customer_profiles(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
