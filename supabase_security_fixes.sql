-- ==========================================
-- SUPABASE SECURITY & PERFORMANCE FIXES
-- ==========================================
-- এই স্ক্রিপ্টটি আপনার ডাটাবেসের নিরাপত্তা নিশ্চিত করতে এবং 
-- কুয়েরি পারফরম্যান্স অপ্টিমাইজ করতে তৈরি করা হয়েছে।
-- এটি আপনি যতবার খুশি রান করতে পারবেন (Idempotent)।

-- ১. এন্ড-ডেট এবং ডোমেইন ট্র্যাকিং কলাম যোগ করা (যদি না থাকে)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_end_date') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_end_date TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_plan') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_plan TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_subscription_from') THEN
        ALTER TABLE public.profiles ADD COLUMN last_subscription_from TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='duration_value') THEN
        ALTER TABLE public.plans ADD COLUMN duration_value INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plans' AND column_name='duration_unit') THEN
        ALTER TABLE public.plans ADD COLUMN duration_unit TEXT DEFAULT 'month';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='saas_settings' AND column_name='homepage_sections') THEN
        ALTER TABLE public.saas_settings ADD COLUMN homepage_sections JSONB;
    END IF;
END $$;

-- ২. ফরেন কি (Foreign Key) সম্পর্ক স্থাপন করা
-- এটি SaaS ড্যাশবোর্ডে "could not find a relationship" এরর সমাধান করবে।
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_profiles_subscription_plan') THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT fk_profiles_subscription_plan 
        FOREIGN KEY (subscription_plan) 
        REFERENCES public.plans(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ৩. পারফরম্যান্স অপ্টিমাইজেশন (Subquery for auth.uid)
-- সুপাবেস গাইডলাইন অনুযায়ী (select auth.uid()) ব্যবহার করা হয়েছে।

-- profiles টেবিলের পলিসি
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles
FOR UPDATE USING ((select auth.uid())::text = id::text);

-- subscription_payments টেবিলের পলিসি
DROP POLICY IF EXISTS "Users can insert their own subscription payments" ON public.subscription_payments;
CREATE POLICY "Users can insert their own subscription payments" ON public.subscription_payments
FOR INSERT WITH CHECK ((select auth.uid())::text = user_id::text);

-- customer_addresses টেবিলের পলিসি
DROP POLICY IF EXISTS "Customers can manage their own addresses" ON public.customer_addresses;
CREATE POLICY "Customers can manage their own addresses" ON public.customer_addresses
FOR ALL USING ((select auth.uid())::text = customer_id::text);

-- ৪. অনিরাপদ পাবলিক আপডেট পলিসি ফিক্স করা (Security Fix)
DROP POLICY IF EXISTS "Anyone can update their own uncompleted order" ON public.uncompleted_orders;
-- নোট: uncompleted_orders এখন শুধুমাত্র সার্ভার-সাইড API (Service Role) দিয়ে আপডেট হবে।

-- ৫. ডেটা ভ্যালিডেশন পলিসি (saas_reviews)
DROP POLICY IF EXISTS "Anyone can submit a review" ON public.saas_reviews;
CREATE POLICY "Anyone can submit a review" ON public.saas_reviews
FOR INSERT WITH CHECK (
    length(name) > 0 AND 
    length(review_text) >= 10
);

-- ৬. ফাংশন সিকিউরিটি (Mutable Search Path Fix)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- ৭. প্রয়োজনীয় ইনডেক্স তৈরি (Performance Boost)
CREATE INDEX IF NOT EXISTS idx_products_site_id ON public.products(site_id);
CREATE INDEX IF NOT EXISTS idx_orders_site_id ON public.orders(site_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_site_id ON public.customer_profiles(site_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);

-- ৮. আরএলএস এনাবল করা (নিশ্চিত করা)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

-- ফিনিশিং মেসেজ
DO $$ BEGIN RAISE NOTICE 'SaaS Platform Security & Performance fixes applied successfully!'; END $$;
