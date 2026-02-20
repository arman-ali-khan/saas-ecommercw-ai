-- supabase_security_fixes.sql
-- Run this script in your Supabase SQL Editor to fix reported security issues.

-- 1. Fix Function Search Paths (Prevents Search Path Hijacking)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;

-- 2. Secure "saas_reviews" Table
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
CREATE POLICY "Public can view approved reviews" ON public.saas_reviews
    FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews
    FOR INSERT WITH CHECK (is_approved = false);

-- 3. Secure "customer_addresses" Table
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
-- We rely on Service Role for API access, so no public policies are needed.

-- 4. Secure "live_chat_messages" Table
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read and write messages" ON public.live_chat_messages;

DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
CREATE POLICY "Anyone can send a message" ON public.live_chat_messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
-- This will be handled by Service Role in the API, but you can add specific admin policies here if needed.

-- 5. Secure "order_items" Table
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
-- Access is managed via Service Role in the API.

-- 6. Secure "uncompleted_orders" Table
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
-- Access is managed via Service Role in the API.

-- 7. Secure "orders" Table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
-- Access is managed via Service Role in the API.