-- ১. ফাংশন সিকিউরিটি (Search Path Fixes)
-- এটি ফাংশনগুলোকে এক্সটার্নাল অ্যাটাক (Search Path Hijacking) থেকে সুরক্ষিত রাখবে।

ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = public;

-- ২. live_chat_messages টেবিল সুরক্ষা
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage messages" ON public.live_chat_messages;
CREATE POLICY "Admins can manage messages" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- ৩. saas_reviews টেবিল সুরক্ষা
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);

-- ৪. carousel_slides টেবিল সুরক্ষা (পারফরম্যান্স অপ্টিমাইজেশন)
ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;
CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);

-- ৫. customer_addresses টেবিল সুরক্ষা
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
-- ডিফল্টভাবে পাবলিক এক্সেস বন্ধ রাখা হয়েছে। এটি এপিআই-এর মাধ্যমে ম্যানেজ হবে।

-- ৬. orders এবং order_items টেবিল সুরক্ষা
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;

-- ৭. uncompleted_orders টেবিল সুরক্ষা
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;