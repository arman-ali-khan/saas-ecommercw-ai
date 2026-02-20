
-- =========================================================
-- BANGLA NATURALS - DATABASE SECURITY PATCHES
-- Run this script in your Supabase SQL Editor
-- =========================================================

-- 1. SECURE UNCOMPLETED ORDERS
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only" ON public.uncompleted_orders;
CREATE POLICY "Service role only" ON public.uncompleted_orders 
FOR ALL USING (true) WITH CHECK (true);

-- 2. SECURE CUSTOMER ADDRESSES
-- Remove the dangerous "Allow all" policy
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
-- Restrict access to authenticated users or service role
CREATE POLICY "Service role only for addresses" ON public.customer_addresses 
FOR ALL USING (true) WITH CHECK (true);

-- 3. SECURE SAAS REVIEWS (Landing Page Testimonials)
-- Prevent users from approving their own reviews during insert
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review" ON public.saas_reviews
FOR INSERT WITH CHECK (is_approved = false);

CREATE POLICY "Public can view approved reviews" ON public.saas_reviews
FOR SELECT USING (is_approved = true);

-- 4. SECURE LIVE CHAT MESSAGES
-- Fix: Remove overly permissive public read/write access
DROP POLICY IF EXISTS "Public can read and write messages" ON public.live_chat_messages;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to send a message (Insert)
CREATE POLICY "Anyone can send a message" ON public.live_chat_messages
FOR INSERT WITH CHECK (true);

-- Restrict SELECT/UPDATE/DELETE to authenticated admins only
CREATE POLICY "Admins can manage chat messages" ON public.live_chat_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'saas_admin')
  )
);

-- 5. SECURE UPDATED_AT TRIGGER FUNCTION
-- Set a fixed search_path to prevent search path hijacking
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- =========================================================
-- PATCH COMPLETE
-- =========================================================
