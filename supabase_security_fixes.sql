-- ১. saas_reviews টেবিল সুরক্ষা: ইউজার যাতে নিজে রিভিউ অ্যাপ্রুভ করতে না পারে
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;

ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (is_approved = false);

CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);

-- ২. carousel_slides টেবিল সুরক্ষা: পারফরম্যান্স এবং অ্যাক্সেস অপ্টিমাইজেশন
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

-- ৩. customer_addresses টেবিল সুরক্ষা: ব্যক্তিগত তথ্য সুরক্ষিত করা
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
-- নোট: এপিআই রুটগুলো Service Role ব্যবহার করে, তাই সরাসরি পাবলিক এক্সেস বন্ধ রাখা হয়েছে।

-- ৪. live_chat_messages টেবিল সুরক্ষা: চ্যাট মেসেজ যাচাইকরণ
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Public can read and write messages for ALL" ON public.live_chat_messages;

ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- ৫. uncompleted_orders, orders এবং order_items টেবিল সুরক্ষা
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;

-- ৬. ফাংশন সিকিউরিটি ফিক্স: search_path সেট করা
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;