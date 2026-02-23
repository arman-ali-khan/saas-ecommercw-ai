
# Firebase Studio - Bangla Naturals E-commerce Platform

এটি একটি আধুনিক মাল্টি-টিন্যান্ট ই-কমার্স প্ল্যাটফর্ম।

## ডাটাবেস সেটআপ ও সিকিউরিটি ফিক্স (Supabase)

আপনার প্রজেক্টটি সঠিকভাবে কাজ করার জন্য এবং নিরাপত্তা নিশ্চিত করতে নিচের ধাপগুলো অনুসরণ করুন:

১. আপনার **Supabase Dashboard**-এ যান।
২. বাম পাশের মেনু থেকে **SQL Editor** সেকশনে যান।
৩. নিচের কোডটুকু কপি করে সুপাবেস এডিটরে পেস্ট করুন এবং **Run** বাটনে ক্লিক করুন।

### ১. সিকিউরিটি এবং সাবস্ক্রিপশন ফিক্স
(আপনার প্রকল্পের রুট ডিরেক্টরিতে থাকা `supabase_security_fixes.sql` ফাইলটি ব্যবহার করুন)

### ২. কাস্টম স্টাইলিং আপডেট (নতুন)
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
ADD COLUMN IF NOT EXISTS theme_destructive text;
```

## শুরু করার নিয়ম

অ্যাপটি ডেভেলপমেন্ট মোডে রান করতে `npm run dev` কমান্ডটি ব্যবহার করুন। মূল কোড দেখতে `src/app/page.tsx` ফাইলটি দেখুন।
