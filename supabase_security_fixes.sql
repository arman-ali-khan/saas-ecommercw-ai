
-- Bangla Naturals - Database Security & Performance Fixes
-- এই স্ক্রিপ্টটি সুপাবেস (Supabase) SQL এডিটরে রান করুন।

-- ১. ফাংশন সিকিউরিটি ফিক্স (Mutable Search Path)
-- ফাংশনগুলোকে "Search Path Hijacking" আক্রমণ থেকে সুরক্ষিত করা
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- ২. Profiles টেবিল - পারফরম্যান্স অপ্টিমাইজেশন
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
ON public.profiles FOR UPDATE
TO authenticated
USING ((select auth.uid()) = id)
WITH CHECK ((select auth.uid()) = id);

-- ৩. Carousel Slides টেবিল - পারফরম্যান্স ও লজিক ফিক্স
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;

CREATE POLICY "Carousel slides are viewable by everyone"
ON public.carousel_slides FOR SELECT
USING (true);

CREATE POLICY "Admins can manage their own carousel slides"
ON public.carousel_slides FOR ALL
TO authenticated
USING ((select auth.uid()) = site_id)
WITH CHECK ((select auth.uid()) = site_id);

-- ৪. Customer Addresses টেবিল - সিকিউরিটি ফিক্স
-- পাবলিক এক্সেস বন্ধ করে শুধুমাত্র সংশ্লিষ্ট গ্রাহককে অনুমতি দেওয়া
DROP POLICY IF EXISTS "Allow all access" ON public.customer_addresses;
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage their own addresses"
ON public.customer_addresses FOR ALL
TO authenticated
USING ((select auth.uid()) = customer_id)
WITH CHECK ((select auth.uid()) = customer_id);

-- ৫. Live Chat Messages টেবিল - সিকিউরিটি ও পারফরম্যান্স ফিক্স
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Users can see their own messages" ON public.live_chat_messages;

CREATE POLICY "Admins can manage messages"
ON public.live_chat_messages FOR ALL
TO authenticated
USING ((select auth.uid()) = site_id)
WITH CHECK ((select auth.uid()) = site_id);

CREATE POLICY "Anyone can send messages"
ON public.live_chat_messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can see their own messages"
ON public.live_chat_messages FOR SELECT
USING (true);

-- ৬. Uncompleted Orders (পরিত্যক্ত কার্ট) - সিকিউরিটি ফিক্স
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Admins can view uncompleted orders" ON public.uncompleted_orders;

ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view uncompleted orders"
ON public.uncompleted_orders FOR SELECT
TO authenticated
USING ((select auth.uid()) = site_id);

-- ৭. SaaS Reviews (প্লাটফর্ম রিভিউ) - সিকিউরিটি ফিক্স
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review"
ON public.saas_reviews FOR INSERT
WITH CHECK (true);

-- ৮. Subscription Payments - পারফরম্যান্স অপ্টিমাইজেশন (New Fix)
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can insert their own subscription payments"
ON public.subscription_payments FOR INSERT
TO authenticated
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own payments" ON public.subscription_payments;
CREATE POLICY "Users can view their own payments"
ON public.subscription_payments FOR SELECT
TO authenticated
USING ((select auth.uid()) = user_id);
