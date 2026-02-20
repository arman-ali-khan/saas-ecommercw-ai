-- 1. Secure handle_updated_at function
-- Fixes: Function public.handle_updated_at has a role mutable search_path
ALTER FUNCTION public.handle_updated_at(jsonb) SET search_path = public;

-- 2. Secure uncompleted_orders table
-- Fixes: Table public.uncompleted_orders is public, but RLS has not been enabled.
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

-- 3. Secure saas_reviews table
-- Fixes: Table public.saas_reviews has an RLS policy Enable insert for all users for INSERT that allows unrestricted access
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Users can submit reviews" ON public.saas_reviews;

ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews" ON public.saas_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can submit reviews" ON public.saas_reviews
    FOR INSERT WITH CHECK (is_approved = false);

-- 4. Secure customer_addresses table
-- Fixes: Table public.customer_addresses has an RLS policy Allow all access for ALL that allows unrestricted access
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Note: No public policies added because the app uses Service Role (Admin) via API routes
-- to manage addresses, keeping data hidden from public PostgREST access.

-- 5. Secure live_chat_messages table
-- Fixes: Table public.live_chat_messages has an RLS policy Public can read and write messages for ALL
DROP POLICY IF EXISTS "Public can read and write messages" ON public.live_chat_messages;
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- Only allow insert for public (customers sending messages)
CREATE POLICY "Public can send messages" ON public.live_chat_messages
    FOR INSERT WITH CHECK (true);

-- Only service role/admins can read/update (managed via API)
-- If you need customers to see their own messages in real-time without an API, 
-- you would add a policy based on conversation_id or sender_id here.

-- 6. Secure order_items table
-- Fixes: Overly permissive public insert policy
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Strictly controlled via API routes with Service Role
