
-- Supabase Security & Performance Fixes
-- This script adds missing columns, optimizes RLS policies, and ensures function security.

-- 1. Add missing columns to tables if they don't exist
DO $$ 
BEGIN
    -- Profiles table updates
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'subscription_end_date') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'profiles' AND column_name = 'last_subscription_from') THEN
        ALTER TABLE public.profiles ADD COLUMN last_subscription_from TEXT;
    END IF;

    -- Plans table updates
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'plans' AND column_name = 'duration_value') THEN
        ALTER TABLE public.plans ADD COLUMN duration_value INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'plans' AND column_name = 'duration_unit') THEN
        ALTER TABLE public.plans ADD COLUMN duration_unit TEXT DEFAULT 'month' CHECK (duration_unit IN ('month', 'year'));
    END IF;

    -- SaaS Settings updates
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name = 'saas_settings' AND column_name = 'global_ai_api_key') THEN
        ALTER TABLE public.saas_settings ADD COLUMN global_ai_api_key TEXT;
    END IF;
END $$;

-- 2. Ensure Foreign Key relationship between profiles and plans exists
-- This helps Supabase and PostgREST understand the relationship for joins
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_plan_fkey') THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_subscription_plan_fkey
        FOREIGN KEY (subscription_plan)
        REFERENCES public.plans(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Function Security: Set search_path for all public functions
-- Prevents "Search Path Hijacking" attacks
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 4. RLS Policy Optimization (Idempotent updates)
-- Uses subqueries (select auth.uid()) which is faster than direct auth.uid() in large tables
-- Uses type casting (::text) to prevent UUID vs TEXT mismatch errors

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING ((SELECT auth.uid())::text = id::text);

-- SaaS Reviews Policies (Fixed permissive INSERT)
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews 
FOR INSERT WITH CHECK (
    name IS NOT NULL AND 
    review_text IS NOT NULL AND 
    LENGTH(review_text) > 5
);

-- Uncompleted Orders Policies
DROP POLICY IF EXISTS "Admins can view uncompleted orders" ON public.uncompleted_orders;
CREATE POLICY "Admins can view uncompleted orders" ON public.uncompleted_orders
FOR SELECT USING ((SELECT auth.uid())::text = site_id::text);

DROP POLICY IF EXISTS "Admins can update uncompleted orders" ON public.uncompleted_orders;
CREATE POLICY "Admins can update uncompleted orders" ON public.uncompleted_orders
FOR UPDATE USING ((SELECT auth.uid())::text = site_id::text);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_site_id ON public.products(site_id);
CREATE INDEX IF NOT EXISTS idx_orders_site_id ON public.orders(site_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_site_id ON public.customer_profiles(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_product_id ON public.flash_deals(product_id);
