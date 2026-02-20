
-- ==========================================================
-- SUPABASE SECURITY FIXES & OPTIMIZATIONS
-- ==========================================================
-- এই স্ক্রিপ্টটি আপনার ডাটাবেসের আরএলএস (RLS) ত্রুটিগুলো সমাধান করবে।
-- সুপাবেস এসকিউএল এডিটরে এটি রান করুন।

-- ১. ফাংশন সিকিউরিটি (Search Path Hijacking প্রতিরোধ)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;

-- ২. customer_addresses টেবিল সুরক্ষা (PRIVATE DATA)
-- অনিরাপদ পলিসি মুছে ফেলা
DROP POLICY IF EXISTS "Allow all access" ON public.customer_addresses;
-- আরএলএস নিশ্চিত করা
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
-- যেহেতু এটি এপিআই (Admin Key) দিয়ে নিয়ন্ত্রিত হয়, তাই সরাসরি পাবলিক এক্সেস বন্ধ রাখা হয়েছে।

-- ৩. live_chat_messages টেবিল সুরক্ষা
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage their site's messages" ON public.live_chat_messages;

ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

-- মেসেজ ইনসার্ট করার সময় ভ্যালিডেশন
CREATE POLICY "Secure message insertion"
ON public.live_chat_messages FOR INSERT
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

-- অ্যাডমিনরা শুধুমাত্র নিজেদের সাইটের মেসেজ দেখতে ও ম্যানেজ করতে পারবে
CREATE POLICY "Admins can manage their site's messages"
ON public.live_chat_messages FOR ALL
TO authenticated
USING (auth.uid() = site_id)
WITH CHECK (auth.uid() = site_id);

-- ৪. carousel_slides পারফরম্যান্স অপ্টিমাইজেশন
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

-- ৫. saas_reviews সুরক্ষা
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
DROP POLICY IF EXISTS "Reviews are viewable if approved" ON public.saas_reviews;

ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review"
ON public.saas_reviews FOR INSERT
WITH CHECK (name IS NOT NULL AND review_text IS NOT NULL AND rating >= 1 AND rating <= 5);

CREATE POLICY "Reviews are viewable if approved"
ON public.saas_reviews FOR SELECT
USING (is_approved = true);

-- ৬. orders, order_items এবং uncompleted_orders সুরক্ষা
-- এপিআই-এর মাধ্যমে সিকিউরড এক্সেস নিশ্চিত করতে আরএলএস এনাবল করা
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Anyone can delete uncompleted orders" ON public.uncompleted_orders;

-- অতিরিক্ত সব অনিরাপদ পাবলিক রাইট এক্সেস বন্ধ করা হয়েছে।
