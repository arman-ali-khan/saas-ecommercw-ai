
-- 1. Function Security: Fix mutable search_path
-- This prevents search path hijacking attacks.
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;

-- 2. Secure saas_reviews table
-- Drop insecure policies if they exist
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;

ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public to view only approved reviews
CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);

-- Allow public to insert reviews (needs moderation)
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (is_approved = false);

-- 3. Secure live_chat_messages table
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;

ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Secure Insert: Ensure basic validation
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

-- Secure Admin Access: Restricted to own site
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- 4. Optimize carousel_slides table
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- 5. Secure customer_addresses table
DROP POLICY IF EXISTS "Allow all access" ON public.customer_addresses;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
-- Direct public access is removed. API uses service role.

-- 6. Secure orders table
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Direct public access is removed. API uses service role.

-- 7. Secure order_items table
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
-- Direct public access is removed. API uses service role.

-- 8. Secure uncompleted_orders table
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
-- Direct public access is removed. API uses service role.
