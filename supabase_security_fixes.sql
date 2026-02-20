-- সুপাবেস সিকিউরিটি ফিক্স স্ক্রিপ্ট
-- এটি আপনার ডাটাবেসের আরএলএস (RLS) এবং ফাংশন সিকিউরিটি নিশ্চিত করবে।

-- ১. ফাংশন সিকিউরিটি ফিক্স (Search Path Issue)
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;

-- ২. carousel_slides টেবিল সুরক্ষা (Redundant Policy Fix)
-- পুরনো পলিসিগুলো মুছে ফেলা হচ্ছে
DROP POLICY IF EXISTS "Carousel slides are viewable by everyone" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can manage their own carousel slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can insert their own carousel slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can update their own carousel slides" ON public.carousel_slides;
DROP POLICY IF EXISTS "Admins can delete their own carousel slides" ON public.carousel_slides;

ALTER TABLE public.carousel_slides ENABLE ROW LEVEL SECURITY;

-- শুধুমাত্র একটি সিলেকশন পলিসি (সবাই দেখতে পারবে)
CREATE POLICY "Carousel slides are viewable by everyone" 
ON public.carousel_slides FOR SELECT 
USING (true);

-- অ্যাডমিনদের জন্য ম্যানেজমেন্ট পলিসি
CREATE POLICY "Admins can manage their own carousel slides" 
ON public.carousel_slides FOR ALL 
TO authenticated 
USING (auth.uid() = site_id) 
WITH CHECK (auth.uid() = site_id);


-- ৩. live_chat_messages টেবিল সুরক্ষা
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Admins can view and manage chat" ON public.live_chat_messages;

ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send a message" 
ON public.live_chat_messages FOR INSERT 
WITH CHECK (site_id IS NOT NULL AND content IS NOT NULL);

CREATE POLICY "Admins can view and manage chat" 
ON public.live_chat_messages FOR ALL 
TO authenticated 
USING (auth.uid() = site_id);


-- ৪. saas_reviews টেবিল সুরক্ষা
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;

ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews" 
ON public.saas_reviews FOR SELECT 
USING (is_approved = true);

CREATE POLICY "Anyone can submit a review" 
ON public.saas_reviews FOR INSERT 
WITH CHECK (is_approved = false);


-- ৫. customer_addresses টেবিল সুরক্ষা (Secure from public)
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
-- নোট: এটি এপিআই-এর মাধ্যমে Service Role দিয়ে নিয়ন্ত্রিত হবে।


-- ৬. order_items এবং orders টেবিল সুরক্ষা
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all inserts for orders" ON public.orders;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;


-- ৭. uncompleted_orders টেবিল সুরক্ষা
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;