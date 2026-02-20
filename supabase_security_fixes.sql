-- Supabase Security Hardening Script
-- আপনার সুপাবেস ড্যাশবোর্ডের SQL Editor-এ (https://supabase.com/dashboard/project/_/sql) এই কোডটি রান করুন।

-- ১. uncompleted_orders টেবিলে Row Level Security (RLS) এনাবল করা
-- এটি আপনার কাস্টমারদের সংবেদনশীল তথ্য (যেমন ফোন নম্বর, ঠিকানা) বাইরের অ্যাক্সেস থেকে রক্ষা করবে।
ALTER TABLE public.uncompleted_orders ENABLE ROW LEVEL SECURITY;

-- দ্রষ্টব্য: আমাদের অ্যাপটি এপিআই রাউটে 'Service Role Key' ব্যবহার করে, 
-- তাই RLS এনাবল থাকলেও অ্যাডমিন প্যানেল থেকে ডেটা ম্যানেজ করতে কোনো সমস্যা হবে না।

-- ২. handle_updated_at ফাংশনের search_path সিকিউরিটি ঠিক করা
-- এটি "search_path hijacking" নামক সাইবার অ্যাটাক প্রতিরোধ করতে সাহায্য করে।
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- ৩. (ঐচ্ছিক কিন্তু জরুরি) অন্যান্য টেবিল চেক করা
-- নিশ্চিত করুন যে আপনার ডাটাবেসের প্রতিটি টেবিলে RLS এনাবল করা আছে।
-- যেমন: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
