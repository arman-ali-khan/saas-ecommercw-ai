
-- 1. FIX: customer_addresses Security
-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;

-- Enable Row Level Security
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Since the app uses Service Role (Admin Key) via API routes to manage addresses,
-- we don't need public policies. This effectively blocks direct unauthorized DB access.


-- 2. FIX: live_chat_messages Security
DROP POLICY IF EXISTS "Public can read and write messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;

ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT a message (required for guests/customers to start chat)
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

-- Admins can manage only their own store messages
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);


-- 3. FIX: saas_reviews Security
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;

ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (is_approved = false); -- Reviews must be approved by admin


-- 4. FIX: order_items Security
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
-- Managed via Service Role API


-- 5. FIX: uncompleted_orders Security
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
-- Managed via Service Role API


-- 6. FIX: orders Security
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
-- Managed via Service Role API


-- 7. FIX: carousel_slides Performance/Duplication
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


-- 8. FIX: Function Security (Search Path)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
