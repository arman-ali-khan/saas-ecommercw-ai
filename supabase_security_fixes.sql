
-- Supabase Security Fixes Script
-- এটি আপনার ডাটাবেসের রিপোর্ট করা নিরাপত্তা ত্রুটিগুলো সমাধান করবে।

-- ১. saas_reviews টেবিল সুরক্ষা
ALTER TABLE IF EXISTS public.saas_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.saas_reviews;
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;

-- নতুন সুরক্ষিত পলিসি: যে কেউ রিভিউ সাবমিট করতে পারবে কিন্তু সেটি ডিফল্টভাবে unapproved থাকবে।
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews 
FOR INSERT WITH CHECK (is_approved = false);

CREATE POLICY "Public can view approved reviews" ON public.saas_reviews 
FOR SELECT USING (is_approved = true);


-- ২. uncompleted_orders টেবিল সুরক্ষা
ALTER TABLE IF EXISTS public.uncompleted_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.uncompleted_orders;
-- পাবলিক অ্যাক্সেস বন্ধ রাখা হয়েছে, শুধুমাত্র Service Role (Admin) ডাটা হ্যান্ডেল করবে।


-- ৩. handle_updated_at ফাংশন সুরক্ষা
-- Search Path সেট করা হচ্ছে যাতে সিকিউরিটি ভাল থাকে।
ALTER FUNCTION public.handle_updated_at() SET search_path = public;


-- ৪. customer_addresses টেবিল সুরক্ষা
ALTER TABLE IF EXISTS public.customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access for ALL" ON public.customer_addresses;
DROP POLICY IF EXISTS "Allow all" ON public.customer_addresses;
-- এই টেবিলটি এখন সার্ভিস রোলের মাধ্যমে সুরক্ষিতভাবে পরিচালিত হবে।


-- ৫. live_chat_messages টেবিল সুরক্ষা
ALTER TABLE IF EXISTS public.live_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read and write messages" ON public.live_chat_messages;
DROP POLICY IF EXISTS "Anyone can send a message" ON public.live_chat_messages;

-- গ্রাহকরা শুধু মেসেজ পাঠাতে পারবে
CREATE POLICY "Anyone can send a message" ON public.live_chat_messages 
FOR INSERT WITH CHECK (sender_type = 'customer');

-- অ্যাডমিনরা সব মেসেজ দেখতে ও উত্তর দিতে পারবে
-- (নোট: অ্যাডমিন এক্সেস সুপাবেস ড্যাশবোর্ড বা সার্ভিস রোলের মাধ্যমে ডিফল্টভাবে থাকে)


-- ৬. order_items টেবিল সুরক্ষা
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert for order_items" ON public.order_items;
-- এটি নিশ্চিত করবে যে অর্ডারের আইটেমগুলো পাবলিকলি কেউ ম্যানিপুলেট করতে পারবে না।
