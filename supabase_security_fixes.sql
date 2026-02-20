
-- সুপাবেস সিকিউরিটি এবং আরএলএস (RLS) ফিক্স স্ক্রিপ্ট
-- এই স্ক্রিপ্টটি আপনার ডাটাবেসের নিরাপত্তা নিশ্চিত করবে।

-- ১. ফাংশন সিকিউরিটি (search_path ফিক্স)
-- এটি search_path হাইজ্যাকিং প্রতিরোধ করে।
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_page_updated_at() SET search_path = public;

-- ২. uncompleted_orders টেবিল সুরক্ষা
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
-- পুরনো অনিরাপদ পলিসি মুছে ফেলা হচ্ছে (যদি থাকে)
DROP POLICY IF EXISTS "Anyone can create uncompleted orders" ON public.uncompleted_orders;
DROP POLICY IF EXISTS "Admins can view all uncompleted orders" ON public.uncompleted_orders;

-- ৩. saas_reviews টেবিল সুরক্ষা
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
CREATE POLICY "Public can view approved reviews" ON public.saas_reviews FOR SELECT USING (is_approved = true);
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews FOR INSERT WITH CHECK (is_approved = false);

-- ৪. customer_addresses টেবিল সুরক্ষা
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;

-- ৫. live_chat_messages টেবিল সুরক্ষা
ALTER TABLE public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read and write messages for ALL" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.live_chat_messages;
CREATE POLICY "Anyone can insert messages" ON public.live_chat_messages FOR INSERT WITH CHECK (true);

-- ৬. order_items টেবিল সুরক্ষা
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
