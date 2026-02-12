import { Users, Target, Rocket, Heart } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে',
  description: 'আমাদের মিশন, দৃষ্টি এবং আপনার অনলাইন ব্যবসাকে শক্তিশালী করার জন্য আমাদের উৎসর্গ সম্পর্কে জানুন।',
};

export default function AboutPage() {
  return (
    <div className="space-y-16 py-12">
      <section className="text-center">
        <h1 className="text-4xl md:text-6xl font-headline font-bold">
          আপনার ব্যবসাকে অনলাইনে আনা
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
          আমরা উদ্যোক্তাদের ক্ষমতায়ন করতে এবং প্রত্যেকের জন্য ই-কমার্সকে সহজলভ্য করতে প্রতিশ্রুতিবদ্ধ। আমাদের প্ল্যাটফর্মটি আপনাকে একটি শক্তিশালী, সুন্দর এবং সফল অনলাইন স্টোর তৈরি করার জন্য প্রয়োজনীয় সমস্ত সরঞ্জাম সরবরাহ করে।
        </p>
      </section>

      <section>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-headline font-bold mb-4">আমাদের গল্প</h2>
            <p className="text-muted-foreground mb-4">
              এই প্ল্যাটফর্মটি একটি সাধারণ ধারণা থেকে শুরু হয়েছিল: বাংলাদেশের ছোট এবং মাঝারি ব্যবসাগুলির জন্য অনলাইনে তাদের পণ্য বিক্রি করা সহজ করা উচিত। আমরা দেখেছি অনেক প্রতিভাবান উদ্যোক্তা এবং কারিগর প্রযুক্তিগত জটিলতার কারণে সংগ্রাম করছেন।
            </p>
            <p className="text-muted-foreground">
              তাই, আমরা একটি দল হিসেবে একত্রিত হয়ে এমন একটি প্ল্যাটফর্ম তৈরি করেছি যা কেবল শক্তিশালীই নয়, ব্যবহার করাও অবিশ্বাস্যভাবে সহজ। আমাদের লক্ষ্য হলো আপনাকে আপনার সবচেয়ে ভালো কাজটি করার সুযোগ দেওয়া - চমৎকার পণ্য তৈরি এবং বিক্রি করা - যখন আমরা প্রযুক্তিগত দিকগুলো সামলাই।
            </p>
          </div>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
             <Image 
                src="https://picsum.photos/seed/saas-about/800/600"
                alt="Our team working"
                fill
                className="object-cover"
                data-ai-hint="team business"
             />
          </div>
        </div>
      </section>

      <section className="text-center">
        <h2 className="text-3xl md:text-4xl font-headline font-bold">
          আমরা যা অফার করি
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
          আপনার ডিজিটাল দোকানকে পরবর্তী স্তরে নিয়ে যাওয়ার জন্য একটি সম্পূর্ণ স্যুট।
        </p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">কাস্টম স্টোরফ্রন্ট</h3>
            <p className="text-muted-foreground mt-2">আপনার ব্র্যান্ডের সাথে মানানসই একটি সুন্দর দোকান তৈরি করুন।</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">সহজ ব্যবস্থাপনা</h3>
            <p className="text-muted-foreground mt-2">সহজেই পণ্য, অর্ডার এবং গ্রাহক পরিচালনা করুন।</p>
          </div>
           <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Rocket className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">এআই টুলস</h3>
            <p className="text-muted-foreground mt-2">এআই-চালিত সরঞ্জাম দিয়ে আপনার বিপণন উন্নত করুন।</p>
          </div>
           <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold">ডেডিকেটেড সাপোর্ট</h3>
            <p className="text-muted-foreground mt-2">আপনার প্রয়োজনে সাহায্য করার জন্য আমাদের টিম এখানে আছে।</p>
          </div>
        </div>
      </section>
      
      <section className="bg-primary text-primary-foreground py-20 text-center rounded-lg">
          <h2 className="text-3xl font-headline font-bold">আমাদের সাথে যোগ দিন</h2>
          <p className="mt-4 max-w-2xl mx-auto">
            আপনার ই-কমার্স যাত্রা শুরু করতে প্রস্তুত? হাজার হাজার সফল উদ্যোক্তার সাথে যোগ দিন।
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8">
            <Link href="/get-started">
              বিনামূল্যে শুরু করুন
            </Link>
          </Button>
      </section>

    </div>
  );
}
