
# Firebase Studio - Bangla Naturals E-commerce Platform

এটি একটি আধুনিক মাল্টি-টিন্যান্ট ই-কমার্স প্ল্যাটফর্ম।

## সিকিউরিটি এবং পারফরম্যান্স সেটআপ (Database Fixes)

সুপাবেস (Supabase) ড্যাশবোর্ডে RLS, Function Search Path বা পারফরম্যান্স নিয়ে কোনো ওয়ার্নিং দেখলে নিচের ধাপগুলো অনুসরণ করুন:

১. আপনার **Supabase Dashboard**-এ যান।
২. বাম পাশের মেনু থেকে **SQL Editor** সেকশনে যান।
৩. এই প্রকল্পের রুট ডিরেক্টরিতে থাকা `supabase_security_fixes.sql` ফাইলটি ওপেন করুন।
৪. ভেতরের কোডটুকু কপি করে সুপাবেস এডিটরে পেস্ট করুন এবং **Run** বাটনে ক্লিক করুন।

### এই ফিক্সগুলো যা নিশ্চিত করে:
- **Performance Optimization**: `profiles`, `carousel_slides` এবং `live_chat_messages` টেবিলে `(select auth.uid())` সাবকুয়েরি ব্যবহারের ফলে বড় ডেটাসেটে কুয়েরি পারফরম্যান্স অনেক দ্রুত হবে।
- **Function Security**: সকল ডাটাবেস ফাংশন এখন "Search Path Hijacking" আক্রমণ থেকে সুরক্ষিত।
- **Secure Data Access**: অর্ডার, কাস্টমার অ্যাড্রেস এবং চ্যাট মেসেজগুলো এখন সঠিক মালিকানা (site_id / customer_id) অনুযায়ী নিয়ন্ত্রিত।
- **Idempotent Script**: এই স্ক্রিপ্টটি আপনি যতবার খুশি রান করতে পারবেন, কোনো এরর হবে না।

## শুরু করার নিয়ম

অ্যাপটি ডেভেলপমেন্ট মোডে রান করতে `npm run dev` কমান্ডটি ব্যবহার করুন। মূল কোড দেখতে `src/app/page.tsx` ফাইলটি দেখুন।
