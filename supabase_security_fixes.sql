-- ১. uncompleted_orders টেবিলের আরএলএস এনাবল করা
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

-- যেহেতু আমাদের অ্যাপ এই টেবিলের জন্য Service Role (Admin) ব্যবহার করে, 
-- তাই এখানে কোনো পাবলিক পলিসি না রাখাই সবচেয়ে নিরাপদ। এতে বাইরের কেউ সরাসরি ডেটা দেখতে পারবে না।


-- ২. handle_updated_at ফাংশনের সার্চ পাথ ফিক্স করা
-- এটি ফাংশনটিকে হাইজ্যাকিং থেকে রক্ষা করে
ALTER FUNCTION public.handle_updated_at() SET search_path = public;


-- ৩. saas_reviews টেবিলের সিকিউরিটি ফিক্স করা
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;

-- পুরনো পারমিসিভ পলিসিটি মুছে ফেলা
DROP POLICY IF EXISTS "Enable insert for all users" ON public.saas_reviews;

-- নতুন এবং নিরাপদ ইনসার্ট পলিসি: ইউজাররা রিভিউ দিতে পারবে কিন্তু সেটি নিজে পাবলিশ করতে পারবে না
-- (is_approved অবশ্যই false হতে হবে)
CREATE POLICY "Safe review insertion" ON public.saas_reviews
FOR INSERT 
WITH CHECK (is_approved = false);

-- পাবলিকলি শুধুমাত্র অ্যাপ্রুভড রিভিউগুলো দেখার অনুমতি দেওয়া
CREATE POLICY "Public can view approved reviews" ON public.saas_reviews
FOR SELECT
USING (is_approved = true);

-- অ্যাডমিনরা (Service Role) সবকিছুই ম্যানেজ করতে পারবে, যা RLS দ্বারা বাধাগ্রস্ত হবে না।
