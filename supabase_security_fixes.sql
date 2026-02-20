
-- 1. Secure uncompleted_orders table
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

-- 2. Fix search_path for handle_updated_at function to prevent search path hijacking
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 3. Secure saas_reviews table (Landing Page Reviews)
-- Drop the overly permissive policy if it exists
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;

-- Enable RLS
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read approved reviews
CREATE POLICY "Allow public read for approved reviews" ON public.saas_reviews
FOR SELECT USING (is_approved = true);

-- Policy: Anyone can insert a review, but it must be unapproved by default
CREATE POLICY "Allow public to submit unapproved reviews" ON public.saas_reviews
FOR INSERT WITH CHECK (is_approved = false);

-- 4. Secure customer_addresses table (FIX: Overly permissive policy)
-- Enable RLS
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Drop the dangerous "Allow all" policy
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;

-- NOTE: Since the application manages addresses via API routes using the Service Role (supabaseAdmin),
-- keeping RLS enabled without any "anon" or "authenticated" policies is the safest approach.
-- This ensures the table cannot be accessed directly via the browser/PostgREST, 
-- while our server-side code (which bypasses RLS using the service key) continues to work perfectly.

-- Optional: If you plan to use standard Supabase Auth for customers in the future, 
-- you can enable the following policy:
-- CREATE POLICY "Users can only access their own addresses" ON public.customer_addresses
-- FOR ALL USING (auth.uid() = customer_id);
