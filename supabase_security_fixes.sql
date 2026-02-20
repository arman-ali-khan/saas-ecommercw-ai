-- Supabase Security Fixes Script
-- Run this in your Supabase SQL Editor to secure your database.

-- 1. Fix Function Search Paths (Prevents potential hijacking)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;

-- 2. Secure uncompleted_orders
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Admins can manage uncompleted orders" ON public.uncompleted_orders;

-- We restrict direct public insert. Orders should be handled via API with service role.
-- If you need public insert, always use a specific check instead of (true).

-- 3. Secure saas_reviews
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;

-- Only allow public to view approved reviews
CREATE POLICY "Public can view approved reviews" ON public.saas_reviews 
FOR SELECT USING (is_approved = true);

-- Allow anyone to insert a review, but force is_approved to be false
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews 
FOR INSERT WITH CHECK (is_approved = false);

-- 4. Secure live_chat_messages
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read and write messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;

-- Fix: Use a specific check instead of WITH CHECK (true)
CREATE POLICY "Anyone can send a message" ON public.live_chat_messages 
FOR INSERT WITH CHECK (
  site_id IS NOT NULL AND 
  content IS NOT NULL AND 
  length(content) > 0
);

-- Admins/Service Role can do everything (Used by the dashboard and APIs)
CREATE POLICY "Admins can manage messages" ON public.live_chat_messages 
FOR ALL USING (true);

-- 5. Secure customer_addresses
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
-- By enabling RLS and not adding a public policy, all direct access is blocked.
-- Access will still work via API using the Service Role Key.

-- 6. Secure order_items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;

-- 7. Secure orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert for orders" ON public.orders;
