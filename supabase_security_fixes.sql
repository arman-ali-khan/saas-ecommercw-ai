-- Supabase Security & Performance Fixes
-- This script fixes RLS issues, Function Search Path vulnerabilities, and Duplicate Policies.

-- 1. Function Security (Fixing Search Path)
-- Prevents search_path hijacking attacks
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;

-- 2. Live Chat Messages Security (FIXED)
-- Fixes the issue where Admins could manage all messages unrestricted
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- 3. SaaS Reviews (Landing Page Testimonials)
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (is_approved = false);

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);

-- 4. Carousel Slides (Performance Optimization)
-- Consolidates multiple permissive policies
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- 5. Customer Addresses (Privacy Protection)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
-- Managed via API using service role, so no public RLS policies needed.

-- 6. Uncompleted Orders (Security)
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
-- Managed via API using service role.

-- 7. Orders & Order Items (Integrity)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;