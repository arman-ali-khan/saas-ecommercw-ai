-- Supabase Security Fixes Script
-- Run this in your Supabase SQL Editor to resolve RLS and security warnings.

-- 1. Secure saas_reviews Table
-- Remove old permissive policies and set up moderated review submission
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;

CREATE POLICY "Public can view approved reviews" ON public.saas_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Anyone can submit a review" ON public.saas_reviews
    FOR INSERT WITH CHECK (is_approved = false);


-- 2. Secure uncompleted_orders Table
-- Enable RLS to prevent direct PostgREST access to sensitive cart data
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;


-- 3. Secure customer_addresses Table
-- Remove the dangerous "Allow all" policy and enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;


-- 4. Secure live_chat_messages Table
-- Allow public to send messages, but restrict viewing to admins and specific owners
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read and write messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Public can insert messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins have full access" ON public.live_chat_messages;

-- Allow anyone (guests/customers) to send a message
CREATE POLICY "Public can insert messages" ON public.live_chat_messages
    FOR INSERT WITH CHECK (true);

-- Allow site admins and saas admins to view and manage messages
CREATE POLICY "Admins have full access" ON public.live_chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'admin' OR profiles.role = 'saas_admin')
        )
    );


-- 5. Fix Function search_path security issues
-- This prevents search_path hijacking attacks
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- Verification Message
DO $$ 
BEGIN 
    RAISE NOTICE 'Database security fixes applied successfully without conflicts.'; 
END $$;