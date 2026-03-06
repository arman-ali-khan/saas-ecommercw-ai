
# DokanBD (দোকানবিডি) - Modern Multi-tenant E-commerce SaaS

**DokanBD** হলো একটি উচ্চ-ক্ষমতাসম্পন্ন মাল্টি-টিন্যান্ট ই-কমার্স প্ল্যাটফর্ম, যা উদ্যোক্তাদের কোনো কোডিং জ্ঞান ছাড়াই নিজস্ব অনলাইন স্টোর তৈরি করতে সাহায্য করে। এটি Next.js 15, Supabase, Tailwind CSS এবং Genkit AI দিয়ে তৈরি।

## মূল ফিচারসমূহ (Main Features)

### ১. প্ল্যাটফর্ম অ্যাডমিন (SaaS Admin)
*   **সাবস্ক্রিপশন ম্যানেজমেন্ট:** ইউজারদের প্ল্যান (Free, Pro, Enterprise) এবং পেমেন্ট ভেরিফিকেশন।
*   **কাস্টম ডোমেইন রিভিউ:** ডোমেইন রিকোয়েস্ট চেক করা এবং DNS কনফিগারেশন ইনস্ট্রাকশন প্রদান।
*   **প্ল্যাটফর্ম কাস্টমাইজেশন:** মেইন ল্যান্ডিং পেজের ফিচার, রিভিউ এবং সেকশন ম্যানেজমেন্ট।

### ২. স্টোর অ্যাডমিন (Store Admin)
*   **এআই টুলস:** এআই ব্যবহার করে পণ্যের ডেসক্রিপশন এবং সোশ্যাল মিডিয়া পোস্ট জেনারেশন।
*   **ইনভেন্টরি:** স্টক ম্যানেজমেন্ট এবং ভেরিয়েন্ট (যেমন: ওজন বা সাইজ) ভিত্তিক আলাদা প্রাইসিং।
*   **অর্ডার প্রসেসিং:** পেন্ডিং থেকে ডেলিভারি পর্যন্ত অর্ডারের পূর্ণ লাইফসাইকেল ম্যানেজমেন্ট।
*   **বাল্ক আপলোড:** WooCommerce CSV ইম্পোর্ট সিস্টেম।
*   **লাইভ চ্যাট:** গ্রাহকদের সাথে সরাসরি যোগাযোগের সুবিধা।

### ৩. গ্রাহক অভিজ্ঞতা (Customer Experience)
*   **PWA সাপোর্ট:** স্টোরটি মোবাইলে অ্যাপ হিসেবে ইনস্টল করার সুবিধা।
*   **অর্ডার ট্র্যাকিং:** ট্রানজেকশন আইডি বা অর্ডার নম্বর দিয়ে সরাসরি ট্র্যাকিং।
*   **ফ্ল্যাশ ডিল:** সময়াবদ্ধ অফার এবং ডিসকাউন্ট।
*   **প্রোফাইল:** অর্ডার হিস্ট্রি এবং সেভ করা অ্যাড্রেস ম্যানেজমেন্ট।

## ডাটাবেস সেটআপ ও সিকিউরিটি (Supabase)

আপনার সুপাবেস ড্যাশবোর্ডের **SQL Editor**-এ নিচের কুয়েরিগুলো রান করুন:

### ১. ওটিপি সিকিউরিটি ফিক্স (গুরুত্বপূর্ণ)
```sql
ALTER TABLE public.customer_otps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can create OTP for INSERT" ON public.customer_otps;
DROP POLICY IF EXISTS "Anyone can create OTP" ON public.customer_otps;

CREATE POLICY "Admins can view site OTPs" ON public.customer_otps 
FOR SELECT USING (auth.uid() = site_id);

CREATE POLICY "Admins can delete site OTPs" ON public.customer_otps 
FOR DELETE USING (auth.uid() = site_id);
```

### ২. কাস্টম ডোমেইন এবং প্রোফাইল আপডেট
```sql
-- For custom domain management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
ALTER TABLE custom_domain_requests ADD COLUMN IF NOT EXISTS dns_info JSONB;

-- For addon subdomain management
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS base_domain TEXT;
UPDATE public.profiles SET base_domain = 'dokanbd.shop' WHERE base_domain IS NULL AND role = 'admin';
```

## এনভায়রনমেন্ট ভেরিয়েবল (Vercel/Local)
*   `NEXT_PUBLIC_BASE_DOMAIN`: `dokanbd.shop` (The primary SaaS platform domain)
*   `NEXT_PUBLIC_SUPABASE_URL`: আপনার সুপাবেস ইউআরএল।
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: সুপাবেস অ্যানন কি।
*   `SUPABASE_SERVICE_ROLE_KEY`: সুপাবেস সার্ভিস রোল কি (সিক্রেট)।
*   `OPENROUTER_API_KEY`: এআই ফিচারের জন্য এপিআই কি।

**নোট:** নতুন স্টোরগুলো ডিফল্টভাবে `*.e-bd.shop` সাবডোমেইনে তৈরি হবে। পুরোনো স্টোরগুলো `*.dokanbd.shop`-এ কাজ করবে।

## শুরু করার নিয়ম
অ্যাপটি লোকাল মেশিনে রান করতে:
1. `npm install`
2. `npm run dev`

আপনার স্টোর ড্যাশবোর্ড দেখতে `localhost:3000/admin` ভিজিট করুন।
