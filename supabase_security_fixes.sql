-- 1. Enable RLS on sensitive tables
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- 2. Secure Database Functions (Fixes Search Path vulnerability)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;

-- 3. Secure saas_reviews (Prevent unrestricted INSERT)
-- Drop existing policies first to avoid "already exists" error
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;

CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);

-- User can only submit reviews that are NOT approved yet (prevents bypassing admin approval)
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (is_approved = false);

-- 4. Secure live_chat_messages (Validation on INSERT)
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can view and manage chat messages" ON public.live_chat_messages;

CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL AND content <> '');

CREATE POLICY "Admins can view and manage chat messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id);

-- 5. Optimized carousel_slides (Performance Fix)
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

-- 6. Strict protection for orders and addresses (Admin API only)
-- We enable RLS and don't create any public policies, effectively restricting access to Service Role only.
