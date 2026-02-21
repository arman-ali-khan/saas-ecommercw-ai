-- Bangla Naturals - Database Security Fixes Script
-- This script fixes RLS policies and function security vulnerabilities.

-- 1. Secure uncompleted_orders table
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

-- Drop all insecure permissive policies
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;

-- Add secure SELECT policy for Admins (site owners)
-- Note: INSERT/UPDATE/DELETE are handled via API with Service Role, so no public policy is needed.
CREATE POLICY "Admins can view their site uncompleted orders" 
ON public.uncompleted_orders FOR SELECT 
TO authenticated 
USING (auth.uid() = site_id);


-- 2. Secure orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;

CREATE POLICY "Admins can view their site orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (auth.uid() = site_id);

CREATE POLICY "Customers can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.jwt() ->> 'sub' = customer_id::text);


-- 3. Secure live_chat_messages
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;

CREATE POLICY "Anyone can insert a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

CREATE POLICY "Admins can manage their own site messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id);


-- 4. Secure customer_addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;

CREATE POLICY "Customers can manage their own addresses" 
ON public.customer_addresses FOR ALL 
USING (auth.jwt() ->> 'sub' = customer_id::text);


-- 5. Optimize carousel_slides (Performance Fix)
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;

CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (auth.uid() = site_id);


-- 6. Secure saas_reviews
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (name IS NOT NULL AND review_text IS NOT NULL);


-- 7. Function Security (Mutable Search Path Fix)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;