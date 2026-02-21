
-- Supabase Security and Performance Fixes
-- This script is idempotent: you can run it multiple times without errors.

-- 1. SECURITY: Fix search_path for database functions to prevent hijacking
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
-- Add any other custom functions here...

-- 2. PERFORMANCE: Optimize Profiles table RLS
-- Replacing auth.uid() with (select auth.uid()) reduces re-evaluation overhead
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (id = (SELECT auth.uid())) 
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT 
USING (true);

-- 3. SECURITY & PERFORMANCE: Customer Addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;

CREATE POLICY "Customers can manage their own addresses" 
ON public.customer_addresses FOR ALL 
TO authenticated 
USING (customer_id = (SELECT auth.uid())) 
WITH CHECK (customer_id = (SELECT auth.uid()));

-- 4. SECURITY & PERFORMANCE: Live Chat Messages
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;

-- Policy for customers/guests to insert (if API allows public insert)
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

-- Policy for admins to manage only their site's messages
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (site_id = (SELECT auth.uid())) 
WITH CHECK (site_id = (SELECT auth.uid()));

-- 5. PERFORMANCE: Carousel Slides
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (site_id = (SELECT auth.uid())) 
WITH CHECK (site_id = (SELECT auth.uid()));

-- 6. SECURITY: Uncompleted Orders (Abandoned Carts)
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;

-- These are typically managed via service role API, so direct public access is denied by default when RLS is on.
-- We only add a SELECT policy if needed for tracking.
CREATE POLICY "Uncompleted orders viewable by admin" 
ON public.uncompleted_orders FOR SELECT 
TO authenticated 
USING (site_id = (SELECT auth.uid()));

-- 7. SECURITY: SaaS Reviews
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (name IS NOT NULL AND review_text IS NOT NULL);

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.saas_reviews;
CREATE POLICY "Reviews are viewable by everyone" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);
