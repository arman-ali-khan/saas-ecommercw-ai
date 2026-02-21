-- Supabase Security Fixes Script
-- This script addresses several security issues related to RLS policies and function search paths.

-- 1. FIX FUNCTION SECURITY (Search Path Issue)
-- Ensures functions are executed within the correct schema context to prevent Search Path Hijacking.
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 2. SECURE uncompleted_orders TABLE
-- Enable RLS and remove overly permissive policies.
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;

-- 3. SECURE orders TABLE
-- Prevent public inserts. Orders should only be created via the API (using Service Role).
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;

-- 4. SECURE customer_addresses TABLE
-- Restrict access to customer addresses.
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;

-- 5. SECURE live_chat_messages TABLE
-- Fix admin access and public insert policies.
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
USING (auth.uid() = site_id);

-- 6. OPTIMIZE carousel_slides TABLE
-- Remove duplicate policies for performance.
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;

CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- 7. FIX saas_reviews TABLE
-- Handle potential "already exists" errors.
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (name IS NOT NULL AND rating >= 1 AND rating <= 5);
