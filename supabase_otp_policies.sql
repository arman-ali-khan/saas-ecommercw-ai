
-- customer_otps টেবিলের নিরাপত্তা নিশ্চিত করার জন্য নিচের কোডটি সুপাবেস এসকিউএল এডিটরে রান করুন।

-- ১. Row Level Security (RLS) সক্রিয় করা
ALTER TABLE customer_otps ENABLE ROW LEVEL SECURITY;

-- ২. যে কেউ ওটিপি তৈরি করতে পারবে (পাবলিক ইনসার্ট)
-- এটি প্রয়োজনীয় কারণ ইউজার লগইন করার আগেই ওটিপি জেনারেট করতে হয়।
DROP POLICY IF EXISTS "Anyone can create OTP" ON customer_otps;
CREATE POLICY "Anyone can create OTP" 
ON customer_otps 
FOR INSERT 
TO public 
WITH CHECK (true);

-- ৩. শুধুমাত্র স্টোর অ্যাডমিন তার নিজের সাইটের ওটিপি ম্যানেজ করতে পারবে
DROP POLICY IF EXISTS "Admins can manage their site's OTPs" ON customer_otps;
CREATE POLICY "Admins can manage their site's OTPs" 
ON customer_otps 
FOR ALL 
TO authenticated 
USING (auth.uid() = site_id);
