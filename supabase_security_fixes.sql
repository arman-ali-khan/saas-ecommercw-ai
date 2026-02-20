-- 1. Secure Functions against Search Path Hijacking
-- Fixing signatures to avoid "function does not exist" errors
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;

-- 2. Secure customer_addresses table
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
-- Note: Access is now restricted to Service Role (Admin) via server-side APIs.

-- 3. Secure uncompleted_orders (Abandoned Carts)
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;
-- Note: Operations are managed via server-side API using Service Role.

-- 4. Secure orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
-- Note: Orders are created via server-side API using Service Role.

-- 5. Secure live_chat_messages table
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;

-- Policy for anyone to insert a message (with basic validation)
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL AND length(content) > 0);

-- Policy for Admins to manage their own store's messages
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- 6. Optimize carousel_slides table (Removing duplicate permissive policies)
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;

-- Public read access
CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

-- Admin full control
CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- 7. Secure saas_reviews (SaaS Landing Page)
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;

-- Allow public to insert (requires approval)
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (is_approved = false);

-- Public can only see approved ones
CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);