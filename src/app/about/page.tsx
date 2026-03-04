'use client';

import { Users, Zap, ShieldCheck, Smartphone, Globe, ArrowLeft, ArrowRight, Heart } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const translations = {
  bn: {
    heroTitle: "আপনার ব্যবসাকে অনলাইনে আনুন সহজে",
    heroDesc: "eHut উদ্যোক্তাদের ক্ষমতায়ন করতে এবং ই-কমার্সকে প্রত্যেকের জন্য সহজলভ্য করতে প্রতিশ্রুতিবদ্ধ। আমাদের প্ল্যাটফর্মটি আপনাকে একটি সফল অনলাইন স্টোর তৈরি করার জন্য প্রয়োজনীয় সকল টুলস সরবরাহ করে।",
    storyTitle: "আমাদের গল্প",
    storyP1: "eHut-এর যাত্রা শুরু হয়েছিল একটি সাধারণ লক্ষ্য নিয়ে: বাংলাদেশের ক্ষুদ্র ও মাঝারি উদ্যোক্তাদের জন্য প্রযুক্তিগত জটিলতা ছাড়াই অনলাইনে পণ্য বিক্রি করার সুযোগ করে দেওয়া।",
    storyP2: "আমরা এমন একটি প্ল্যাটফর্ম তৈরি করেছি যা অত্যন্ত শক্তিশালী হওয়া সত্ত্বেও ব্যবহার করা সহজ। আমাদের লক্ষ্য হলো আপনাকে আপনার সৃজনশীল কাজে মনোনিবেশ করার সুযোগ দেওয়া।",
    statActive: "সক্রিয় উদ্যোক্তা",
    statSuccess: "সফল ডেলিভারি",
    whyTitle: "কেন আমরা সেরা?",
    whyDesc: "আপনার ডিজিটাল ব্যবসার পূর্ণাঙ্গ সমাধানের জন্য আমরা যা অফার করি",
    feature1: "নিজস্ব ডোমেইন", feature1Desc: "আপনার পছন্দের নামে দোকান চালু করুন।",
    feature2: "এআই পাওয়ার", feature2Desc: "এআই দিয়ে প্রোডাক্ট ডেসক্রিপশন জেনারেট করুন।",
    feature3: "সুরক্ষিত পেমেন্ট", feature3Desc: "SSLCommerz এর মাধ্যমে নিরাপদ পেমেন্ট।",
    feature4: "মোবাইল অপ্টিমাইজড", feature4Desc: "যে কোনো ডিভাইসে চমৎকার ইউজার এক্সপেরিয়েন্স।",
    ctaTitle: "আমাদের সাথে আপনার যাত্রা শুরু হোক",
    ctaDesc: "হাজার হাজার সফল উদ্যোক্তার সাথে যোগ দিন এবং আজই আপনার স্বপ্নের ই-কমার্স স্টোর চালু করুন।",
    startFree: "বিনামূল্যে শুরু করুন",
    login: "লগ ইন করুন"
  },
  en: {
    heroTitle: "Bring Your Business Online Easily",
    heroDesc: "eHut is committed to empowering entrepreneurs and making e-commerce accessible to everyone. Our platform provides all the tools needed to build a successful online store.",
    storyTitle: "Our Story",
    storyP1: "The journey of eHut started with a simple goal: to provide small and medium entrepreneurs in Bangladesh the opportunity to sell products online without technical complexities.",
    storyP2: "We have built a platform that is extremely powerful yet easy to use. Our goal is to give you the chance to focus on your creative work.",
    statActive: "Active Entrepreneurs",
    statSuccess: "Successful Deliveries",
    whyTitle: "Why Choose Us?",
    whyDesc: "What we offer for a complete solution to your digital business",
    feature1: "Custom Domain", feature1Desc: "Launch your store with your preferred name.",
    feature2: "AI Power", feature2Desc: "Generate product descriptions using AI.",
    feature3: "Secure Payment", feature3Desc: "Safe payments via SSLCommerz.",
    feature4: "Mobile Optimized", feature4Desc: "Excellent user experience on any device.",
    ctaTitle: "Start Your Journey with Us",
    ctaDesc: "Join thousands of successful entrepreneurs and launch your dream e-commerce store today.",
    startFree: "Start for Free",
    login: "Login Now"
  }
};

export default function AboutPage() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  useEffect(() => {
    const country = sessionStorage.getItem('visitor_country');
    if (country && country !== 'BD') setLang('en');
  }, []);

  const t = translations[lang];

  return (
    <div className="space-y-24 py-12">
      <section className="text-center space-y-6 relative">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
        <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          {t.heroTitle}
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
          {t.heroDesc}
        </p>
      </section>

      <section>
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">{t.storyTitle}</h2>
            <div className="space-y-4 text-muted-foreground text-lg leading-relaxed">
              <p>{t.storyP1}</p>
              <p>{t.storyP2}</p>
            </div>
            <div className="pt-4 grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <p className="text-3xl font-black text-primary">১০০০+</p>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.statActive}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-black text-primary">৯৯.৯%</p>
                    <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.statSuccess}</p>
                </div>
            </div>
          </div>
          <div className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden border-2 border-primary/10 shadow-2xl group">
             <Image 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
                alt="Team" fill className="object-cover transition-transform duration-700 group-hover:scale-105"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="text-center space-y-12">
        <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold">{t.whyTitle}</h2>
            <p className="max-w-2xl mx-auto text-muted-foreground text-lg">{t.whyDesc}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Globe, title: t.feature1, desc: t.feature1Desc },
            { icon: Zap, title: t.feature2, desc: t.feature2Desc },
            { icon: ShieldCheck, title: t.feature3, desc: t.feature3Desc },
            { icon: Smartphone, title: t.feature4, desc: t.feature4Desc }
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
      
      <section className="relative rounded-[3rem] overflow-hidden py-20 px-8 text-center text-primary-foreground shadow-2xl bg-primary">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 space-y-8">
              <h2 className="text-4xl md:text-6xl font-headline font-bold">{t.ctaTitle}</h2>
              <p className="max-w-2xl mx-auto text-lg md:text-xl opacity-90 leading-relaxed">{t.ctaDesc}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="h-14 px-10 rounded-full text-lg font-bold shadow-xl transition-transform hover:scale-105 active:scale-95">
                    <Link href="/get-started">{t.startFree}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg font-bold bg-white/10 border-white/20 backdrop-blur-sm transition-transform hover:scale-105 active:scale-95">
                    <Link href="/login">{t.login}</Link>
                </Button>
              </div>
          </div>
      </section>
    </div>
  );
}