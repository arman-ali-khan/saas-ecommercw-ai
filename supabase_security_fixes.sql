-- ==========================================================
-- SUPABASE SECURITY & PERFORMANCE FIXES
-- ==========================================================
-- এই স্ক্রিপ্টটি রান করলে আপনার ডাটাবেসের নিরাপত্তা ত্রুটি এবং 
-- আরএলএস (RLS) পারফরম্যান্স ইস্যুগুলো সমাধান হবে।
-- ==========================================================

-- ১. ফাংশন সিকিউরিটি (Mutable Search Path Fix)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;

-- ২. PROFILES টেবিল পারফরম্যান্স ফিক্স
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." 
ON public.profiles FOR UPDATE 
USING (id = (SELECT auth.uid())) 
WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.profiles FOR SELECT 
USING (true);

-- ৩. ORDERS টেবিল সুরক্ষা (Secure Insert)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
-- পাবলিক সরাসরি ইনসার্ট করতে পারবে না, এপিআই Service Role ব্যবহার করবে।
CREATE POLICY "Admins can view their own orders" 
ON public.orders FOR SELECT 
TO authenticated 
USING (site_id = (SELECT auth.uid()));

-- ৪. UNCOMPLETED_ORDERS টেবিল সুরক্ষা
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;
CREATE POLICY "Admins can manage uncompleted orders" 
ON public.uncompleted_orders FOR ALL 
TO authenticated 
USING (site_id = (SELECT auth.uid()))
WITH CHECK (site_id = (SELECT auth.uid()));

-- ৫. CUSTOMER_ADDRESSES টেবিল সুরক্ষা (Private Access)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
-- ইউজাররা শুধুমাত্র তাদের নিজেদের অ্যাড্রেস দেখতে এবং ম্যানেজ করতে পারবে
CREATE POLICY "Customers can manage their own addresses" 
ON public.customer_addresses FOR ALL 
TO authenticated 
USING (customer_id = (SELECT auth.uid())) 
WITH CHECK (customer_id = (SELECT auth.uid()));

-- ৬. LIVE_CHAT_MESSAGES টেবিল সুরক্ষা
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (site_id = (SELECT auth.uid())) 
WITH CHECK (site_id = (SELECT auth.uid()));

-- ৭. CAROUSEL_SLIDES পারফরম্যান্স ও ডুপ্লিকেট ফিক্স
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;

CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (site_id = (SELECT auth.uid())) 
WITH CHECK (site_id = (SELECT auth.uid()));

-- ৮. SAAS_REVIEWS টেবিল সুরক্ষা
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (name IS NOT NULL AND review_text IS NOT NULL);

DROP POLICY IF EXISTS "Approved reviews are public" ON public.saas_reviews;
CREATE POLICY "Approved reviews are public" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);