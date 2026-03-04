
import { Users, Target, Rocket, Heart, CheckCircle2, Zap, ShieldCheck, Globe } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'আমাদের সম্পর্কে - eHut',
  description: 'আমাদের মিশন, ভিশন এবং আপনার অনলাইন ব্যবসাকে শক্তিশালী করার লক্ষ্য সম্পর্কে জানুন।',
};

export default function AboutPage() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 relative">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
        <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          আপনার ব্যবসাকে <br /> অনলাইনে আনুন সহজে
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
          eHut উদ্যোক্তাদের ক্ষমতায়ন করতে এবং ই-কমার্সকে প্রত্যেকের জন্য সহজলভ্য করতে প্রতিশ্রুতিবদ্ধ। আমাদের প্ল্যাটফর্মটি আপনাকে একটি শক্তিশালী, সুন্দর এবং সফল অনলাইন স্টোর তৈরি করার জন্য প্রয়োজনীয় সকল আধুনিক টুলস সরবরাহ করে।
        </p>
      </section>

      {/* Story Section */}
      <section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">আমাদের গল্প</h2>
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>
                eHut-এর যাত্রা শুরু হয়েছিল একটি সাধারণ লক্ষ্য নিয়ে: বাংলাদেশের ক্ষুদ্র ও মাঝারি উদ্যোক্তাদের জন্য প্রযুক্তিগত জটিলতা ছাড়াই অনলাইনে পণ্য বিক্রি করার সুযোগ করে দেওয়া। আমরা দেখেছি অনেক প্রতিভাবান কারিগর ও ব্যবসায়ী শুধুমাত্র সঠিক প্ল্যাটফর্মের অভাবে পিছিয়ে পড়ছেন।
              </p>
              <p>
                তাই আমরা এমন একটি প্ল্যাটফর্ম তৈরি করেছি যা অত্যন্ত শক্তিশালী হওয়া সত্ত্বেও ব্যবহার করা সহজ। আমাদের লক্ষ্য হলো আপনাকে আপনার সৃজনশীল কাজে মনোনিবেশ করার সুযোগ দেওয়া, যখন আমরা আপনার দোকানের প্রযুক্তিগত দিকগুলো সামলাবো।
              </p>
            </div>
            <div className="pt-4 grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-3xl font-black text-primary">১০০০+</p>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">সক্রিয় উদ্যোক্তা</p>
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-black text-primary">৯৯.৯%</p>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">সফল ডেলিভারি</p>
                </div>
            </div>
          </div>
          <div className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden border-2 border-primary/10 shadow-2xl group">
             <Image 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
                alt="Our team working"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                data-ai-hint="office collaboration"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="text-center space-y-12">
        <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold">কেন আমরা সেরা?</h2>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg">আপনার ডিজিটাল ব্যবসার পূর্ণাঙ্গ সমাধানের জন্য আমরা যা অফার করি</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Globe, title: "নিজস্ব ডোমেইন", desc: "আপনার পছন্দের নামে দোকান চালু করুন।" },
            { icon: Zap, title: "এআই পাওয়ার", desc: "এআই দিয়ে প্রোডাক্ট ডেসক্রিপশন জেনারেট করুন।" },
            { icon: ShieldCheck, title: "সুরক্ষিত পেমেন্ট", desc: "SSLCommerz এর মাধ্যমে নিরাপদ পেমেন্ট।" },
            { icon: Smartphone, title: "মোবাইল অপ্টিমাইজড", desc: "যে কোনো ডিভাইসে চমৎকার ইউজার এক্সপেরিয়েন্স।" }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-[2rem] bg-card border-2 border-border/50 hover:border-primary/20 transition-all hover:-translate-y-2">
                <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                    <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative rounded-[3rem] overflow-hidden py-20 px-8 text-center text-primary-foreground shadow-2xl bg-primary">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-headline font-bold">আমাদের সাথে আপনার যাত্রা শুরু হোক</h2>
              <p className="max-w-2xl mx-auto text-lg md:text-xl opacity-90 leading-relaxed">
                হাজার হাজার সফল উদ্যোক্তার সাথে যোগ দিন এবং আজই আপনার স্বপ্নের ই-কমার্স স্টোর চালু করুন।
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="h-14 px-10 rounded-full text-lg font-bold shadow-xl transition-transform hover:scale-105 active:scale-95">
                    <Link href="/get-started">বিনামূল্যে শুরু করুন</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg font-bold bg-white/10 border-white/20 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
                    <Link href="/login">লগ ইন করুন</Link>
                </Button>
              </div>
          </div>
      </section>
    </div>
  );
}
