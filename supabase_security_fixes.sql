-- Bangla Naturals - Central Database Security Fixes
-- This script fixes RLS issues and function security vulnerabilities.

-- 1. Secure Database Functions
-- Fix for ERROR: 42883 (function signature mismatch)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 2. Secure Table: saas_reviews
-- Ensure RLS is enabled
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

-- Remove insecure policies if they exist
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can submit unapproved reviews" ON public.saas_reviews;

-- Create secure policies
-- Anyone can view reviews that are already approved by an admin
CREATE POLICY "Public can view approved reviews" ON public.saas_reviews 
FOR SELECT USING (is_approved = true);

-- Anyone can submit a review, but it must be unapproved (is_approved = false) by default
CREATE POLICY "Public can submit unapproved reviews" ON public.saas_reviews 
FOR INSERT WITH CHECK (is_approved = false);


-- 3. Secure Table: customer_addresses
-- Customers' private addresses should not be exposed to the internet
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive policies
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;

-- Note: The application uses the Service Role (Admin Key) to manage addresses,
-- so no public RLS policies are needed. This keeps data fully locked from direct browser access.


-- 4. Secure Table: live_chat_messages
-- Prevent unauthorized access to private conversations
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Remove insecure policies
DROP POLICY IF EXISTS "Public can read and write messages for ALL" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.live_chat_messages;

-- Allow anyone to send (INSERT) a message to start or continue a chat
CREATE POLICY "Anyone can send messages" ON public.live_chat_messages 
FOR INSERT WITH CHECK (true);

-- Note: SELECT/UPDATE/DELETE are restricted to Service Role or should be explicitly
-- defined if client-side direct reading is required.


-- 5. Secure Table: order_items
-- Prevent unauthorized tampering with order data
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Remove insecure policies
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;


-- 6. Secure Table: uncompleted_orders
-- Prevent unauthorized access to abandoned cart data
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

-- No public policies needed as this is handled via backend API with Service Role.

-- End of Security Fixes
