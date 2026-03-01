
# Firebase Studio - eHut E-commerce Platform

এটি একটি আধুনিক মাল্টি-টিন্যান্ট ই-কমার্স প্ল্যাটফর্ম।

## ডাটাবেস সেটআপ ও সিকিউরিটি ফিক্স (Supabase)

আপনার প্রজেক্টটি সঠিকভাবে কাজ করার জন্য এবং নিরাপত্তা নিশ্চিত করতে নিচের ধাপগুলো অনুসরণ করুন:
   
১. আপনার **Supabase Dashboard**-এ যান।
২. বাম পাশের মেনু থেকে **SQL Editor** সেকশনে যান।
৩. নিচের ফাইলগুলোর কোড কপি করে সুপাবেস এডিটরে পেস্ট করুন এবং **Run** বাটনে ক্লিক করুন।

### ১. পুশ নোটিফিকেশন সেটআপ (FCM)
Firebase Cloud Messaging টোকেন সংরক্ষণের জন্য নিচের কোডটি রান করুন:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_tokens text[] DEFAULT '{}';
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS fcm_tokens text[] DEFAULT '{}';
```

### ২. লাইভ চ্যাট সিকিউরিটি ফিক্স (গুরুত্বপূর্ণ)
লাইভ চ্যাট টেবিলের নিরাপত্তা নিশ্চিত করতে এবং অবৈধ মেসেজ ইনসার্ট বন্ধ করতে প্রকল্পের রুটে থাকা `supabase_live_chat_fixes.sql` ফাইলের কোডটি রান করুন। এটি নিশ্চিত করবে যে:
- শুধুমাত্র `customer` টাইপ মেসেজ পাবলিকলি ইনসার্ট করা যাবে (স্প্যাম রোধে)।
- স্টোর অ্যাডমিনরা শুধু তাদের নিজস্ব স্টোরের মেসেজ দেখতে ও রিপ্লাই দিতে পারবেন।
- SaaS অ্যাডমিনরা সব চ্যাটে পূর্ণ নিয়ন্ত্রণ পাবেন।

### ৩. সাপোর্ট সিস্টেম সিকিউরিটি পলিসি
সাপোর্ট টিকেট এবং মেসেজগুলোর নিরাপত্তা নিশ্চিত করতে প্রকল্পের রুটে থাকা `supabase_support_policies.sql` ফাইলের কোডটি রান করুন। এটি নিশ্চিত করবে যে:
- স্টোর অ্যাডমিনরা শুধুমাত্র তাদের নিজস্ব টিকেট দেখতে ও তৈরি করতে পারবেন।
- SaaS অ্যাডমিনরা সব টিকেটে পূর্ণ নিয়ন্ত্রণ পাবেন।

### ৪. ওটিপি (OTP) সিকিউরিটি পলিসি
ওটিপি টেবিলের নিরাপত্তা নিশ্চিত করতে প্রকল্পের রুটে থাকা `supabase_otp_policies.sql` ফাইলের কোডটি রান করুন। এটি নিশ্চিত করবে যে:
- যে কেউ ওটিপি রিকোয়েস্ট করতে পারবে (রেজিস্ট্রেশন/পাসওয়ার্ড রিসেটের জন্য)।
- শুধুমাত্র স্টোর অ্যাডমিনরা তাদের স্টোরের ওটিপি ডেটা দেখতে বা মুছতে পারবে।

### ৫. মেইন সিকিউরিটি এবং সাবস্কৃপশন ফিক্স
(আপনার প্রকল্পের রুট ডিরেক্টরিতে থাকা `supabase_security_fixes.sql` ফাইলটি ব্যবহার করুন)

### ৬. কাস্টম স্টাইলিং আপডেট
অ্যাপিয়ারেন্স ম্যানেজারের নতুন কালার অপশনগুলো চালু করতে এই কোডটি রান করুন:
```sql
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS theme_primary_foreground text,
ADD COLUMN IF NOT EXISTS theme_secondary text,
ADD COLUMN IF NOT EXISTS theme_secondary_foreground text,
ADD COLUMN IF NOT EXISTS theme_accent text,
ADD COLUMN IF NOT EXISTS theme_accent_foreground text,
ADD COLUMN IF NOT EXISTS theme_foreground text,
ADD COLUMN IF NOT EXISTS theme_card text,
ADD COLUMN IF NOT EXISTS theme_card_foreground text,
ADD COLUMN IF NOT EXISTS theme_muted text,
ADD COLUMN IF NOT EXISTS theme_muted_foreground text,
ADD COLUMN IF NOT EXISTS theme_border text,
ADD COLUMN IF NOT EXISTS theme_input text,
ADD COLUMN IF NOT EXISTS theme_destructive text,
ADD COLUMN IF NOT EXISTS pwa_logo_url text;
```

## এনভায়রনমেন্ট ভেরিয়েবল (Environment Variables)

আপনার প্রজেক্টটি ডেপলয় করার সময় নিচের ভেরিয়েবলগুলো সেট করা নিশ্চিত করুন:

### Cloudinary (ছবি আপলোড এর জন্য)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: আপনার ক্লাউডিনারি ক্লাউড নেম।
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: একটি "Unsigned" আপলোড প্রিসেট।
- `CLOUDINARY_API_KEY`: আপনার এপিআই কি।
- `CLOUDINARY_API_SECRET`: আপনার এপিআই সিক্রেট।

### Supabase
- `NEXT_PUBLIC_SUPABASE_URL`: সুপাবেস প্রজেক্ট ইউআরএল।
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: সুপাবেস অ্যানন কি।
- `SUPABASE_SERVICE_ROLE_KEY`: সুপাবেস সার্ভিস রোল কি (সিক্রেট)।

## শুরু করার নিয়ম

অ্যাপটি ডেভেলপমেন্ট মোডে রান করতে `npm run dev` কমান্ডটি ব্যবহার করুন। মূল কোড দেখতে `src/app/page.tsx` ফাইলটি দেখুন।
