
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  ArrowRight,
  CheckCircle,
  Star,
  Zap,
  ShieldCheck,
  Smartphone,
  Globe,
} from 'lucide-react';
import SaasHeader from '@/components/saas-header';
import SaasFooter from '@/components/saas-footer';
import { type SaasFeature, type SaaSReview, type SaasShowcaseItem, type SaasSettings } from '@/types';
import DynamicIcon from './dynamic-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SaasLandingClientProps {
  plans: any[];
  features: SaasFeature[];
  reviews: SaaSReview[];
  showcaseItems: SaasShowcaseItem[];
  settings: SaasSettings | null;
  sections: any[];
}

const landingTranslations = {
  bn: {
    heroBadge: "নতুন: এআই প্রোডাক্ট ডেসক্রিপশন জেনারেটর এখন লাইভ!",
    heroTitle: "আপনার স্বপ্নের স্টোর এখন বাস্তবের পথে",
    heroDesc: "বাংলা ন্যাচারালস-এর মাধ্যমে কয়েক মিনিটের মধ্যেই শুরু করুন আপনার নিজস্ব ই-কমার্স প্ল্যাটফর্ম। এআই-চালিত টুলস এবং কাস্টমাইজযোগ্য ডিজাইন নিয়ে আজই আপনার ব্র্যান্ড চালু করুন।",
    startBtn: "ফ্রি ট্রায়াল শুরু করুন",
    plansBtn: "প্ল্যানগুলো দেখুন",
    featuresTitle: "সবকিছু যা আপনার প্রয়োজন",
    featuresDesc: "আধুনিক ই-কমার্স ব্যবসার জন্য প্রয়োজনীয় সকল ফিচার এখন এক জায়গায়।",
    showcaseTitle: "প্ল্যাটফর্ম শোকেস",
    showcaseDesc: "আমাদের শক্তিশালী ড্যাশবোর্ড এবং ফিচারগুলোর এক ঝলক দেখে নিন।",
    statsStores: "সক্রিয় স্টোর",
    statsUptime: "আপটাইম",
    statsSetup: "সেটআপ টাইম",
    statsSupport: "সাপোর্ট",
    pricingTitle: "স্বচ্ছ এবং সহজ প্রাইসিং",
    pricingDesc: "আপনার ব্যবসার আকার অনুযায়ী সেরা প্ল্যানটি বেছে নিন। কোনো লুকানো চার্জ নেই।",
    testimonialTitle: "ইউজাররা যা বলছেন",
    ctaTitle: "আপনার অনলাইন যাত্রা আজই শুরু হোক",
    ctaDesc: "হাজার হাজার উদ্যোক্তার সাথে যোগ দিন যারা বাংলা ন্যাচারালস ব্যবহার করে তাদের ব্র্যান্ডকে সফলভাবে গড়ে তুলছেন।",
    ctaNoCredit: "ক্রেডিট কার্ড লাগবে না",
    ctaMobile: "মোবাইল অ্যাপ এক্সপেরিয়েন্স",
    ctaDomain: "কাস্টম ডোমেইন",
    mostPopular: "জনপ্রিয় প্ল্যান",
    viewAll: "সব দেখুন",
    free: "ফ্রি",
    contactUs: "যোগাযোগ করুন",
    choosePro: "প্রো বেছে নিন",
    startNow: "এখনই শুরু করুন"
  },
  en: {
    heroBadge: "NEW: AI Product Description Generator is now live!",
    heroTitle: "Your Dream Store is Now a Reality",
    heroDesc: "Launch your own e-commerce platform in minutes with DokanBD. Start your brand today with AI-powered tools and customizable designs.",
    startBtn: "Start Free Trial",
    plansBtn: "View Plans",
    featuresTitle: "Everything You Need",
    featuresDesc: "All the features required for a modern e-commerce business, all in one place.",
    showcaseTitle: "Platform Showcase",
    showcaseDesc: "A quick glimpse of our powerful dashboard and features.",
    statsStores: "Active Stores",
    statsUptime: "Uptime",
    statsSetup: "Setup Time",
    statsSupport: "Support",
    pricingTitle: "Transparent & Easy Pricing",
    pricingDesc: "Choose the best plan based on your business size. No hidden charges.",
    testimonialTitle: "What Our Users Say",
    ctaTitle: "Start Your Online Journey Today",
    ctaDesc: "Join thousands of entrepreneurs who are successfully building their brands using DokanBD.",
    ctaNoCredit: "No Credit Card Required",
    ctaMobile: "Mobile App Experience",
    ctaDomain: "Custom Domain",
    mostPopular: "Most Popular",
    viewAll: "View All",
    free: "Free",
    contactUs: "Contact Us",
    choosePro: "Choose Pro",
    startNow: "Start Now"
  }
};

export default function SaasLandingClient({ plans, features, reviews, showcaseItems, settings, sections }: SaasLandingClientProps) {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const t = landingTranslations[lang];

  // --- VISITOR TRACKING & LANGUAGE DETECTION ---
  useEffect(() => {
    const trackVisitor = async () => {
        try {
            const response = await fetch('/api/saas/tracking');
            if (response.ok) {
                const data = await response.json();
                // Set language based on country code
                if (data.countryCode && data.countryCode !== 'BD') {
                    setLang('en');
                }
                sessionStorage.setItem('visitor_tracked', 'true');
            }
        } catch (err) {
            console.error("Tracking error:", err);
        }
    };
    
    // Check cache first to avoid layout shift on navigation
    const cachedCountry = sessionStorage.getItem('visitor_country');
    if (cachedCountry) {
        if (cachedCountry !== 'BD') setLang('en');
    } else {
        trackVisitor();
    }
  }, []);
  // ---------------------------------------------

  const translatedPlans = useMemo(() => {
    return plans.map(plan => {
        let ctaText = plan.cta;
        let priceText = plan.price;

        if (lang === 'en') {
            if (plan.id === 'free') {
                ctaText = t.startNow;
                priceText = "Free";
            } else if (plan.id === 'pro') {
                ctaText = t.choosePro;
            } else if (plan.id === 'enterprise') {
                ctaText = t.contactUs;
            }
        }

        return { ...plan, cta: ctaText, price: priceText };
    });
  }, [plans, lang, t]);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const renderSection = (section: any) => {
    if (!section.enabled) return null;

    switch (section.id) {
      case 'hero':
        return (
          <motion.section 
            key="hero"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center relative pt-4 md:pt-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-pulse">
              <Zap className="w-3 h-3" />
              <span>{t.heroBadge}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 mb-6">
              {settings?.hero_title || t.heroTitle}
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              {settings?.hero_description || t.heroDesc}
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
              <Button asChild size="lg" className="h-12 px-8 rounded-full text-lg shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                <Link href="/get-started">
                  {t.startBtn} <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-full text-lg backdrop-blur-sm bg-background/50 transition-transform hover:scale-105 active:scale-95">
                <Link href="#pricing">{t.plansBtn}</Link>
              </Button>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="mt-20 relative group"
            >
              <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full scale-75 group-hover:scale-100 transition-transform duration-700 opacity-50" />
              <div className="relative border border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl mx-auto max-w-5xl">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                </div>
                <div className="aspect-[16/9] relative">
                  <Image
                    src={settings?.hero_image_url || "https://images.unsplash.com/photo-1628882139032-a1314387532f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxlY29tbWVyY2UlMjBhcHB8ZW58MHx8fHwxNzcxMDQzODA2fDA&ixlib=rb-4.1.0&q=80&w=1200"}
                    alt="Platform Dashboard"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </motion.section>
        );
      case 'features':
        return (
          <section key="features" id="features" className="relative">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4 text-foreground">{t.featuresTitle}</h2>
              <p className="text-muted-foreground text-lg">{t.featuresDesc}</p>
            </div>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {features.map((feature) => (
                <motion.div key={feature.id} variants={fadeIn}>
                  <Card className="h-full rounded-2xl border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all group overflow-hidden border-2 hover:border-primary/20">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <DynamicIcon name={feature.icon} className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl font-bold">{feature.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>
        );
      case 'showcase':
        return (
            <section key="showcase" id="showcase" className="relative">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4 text-foreground">{t.showcaseTitle}</h2>
                    <p className="text-muted-foreground text-lg">{t.showcaseDesc}</p>
                </div>

                <div className="px-4 relative group">
                    <div className="max-w-5xl mx-auto">
                    <Carousel opts={{ align: 'start', loop: true }} className="w-full relative">
                        <CarouselContent>
                        {showcaseItems.map((item) => (
                            <CarouselItem key={item.id} className="basis-full">
                            <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden border-2 border-border/50 shadow-2xl group/item">
                                {item.image_url ? (
                                <Image src={item.image_url} alt={item.title} fill className="object-cover transition-transform duration-700 group-hover/item:scale-105" />
                                ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                    <DynamicIcon name={item.icon} className="w-20 h-20 text-muted-foreground" />
                                </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12 text-white">
                                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                                    <h3 className="text-2xl md:text-4xl font-bold font-headline mb-3">{item.title}</h3>
                                    <p className="text-white/80 text-sm md:text-lg max-w-3xl line-clamp-2 md:line-clamp-none leading-relaxed">{item.description}</p>
                                </motion.div>
                                </div>
                            </div>
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <div className="hidden md:block">
                        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/80 backdrop-blur-md border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-xl transition-all" />
                        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 bg-background/80 backdrop-blur-md border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-xl transition-all" />
                        </div>
                    </Carousel>
                    </div>
                </div>
            </section>
        );
      case 'stats':
        return (
          <section key="stats" className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-border/50">
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2 text-foreground">1000+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">{t.statsStores}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2 text-foreground">99.9%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">{t.statsUptime}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2 text-foreground">5 Min</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">{t.statsSetup}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2 text-foreground">24/7</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">{t.statsSupport}</div>
            </div>
          </section>
        );
      case 'pricing':
        return (
          <section key="pricing" id="pricing" className="relative scroll-mt-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4 text-foreground">{t.pricingTitle}</h2>
              <p className="text-muted-foreground text-lg">{t.pricingDesc}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {translatedPlans.map((tier) => (
                <motion.div 
                  key={tier.id}
                  whileHover={{ y: -10 }}
                  className="h-full"
                >
                  <Card
                    className={cn(
                      "h-full rounded-3xl flex flex-col transition-all border-2",
                      tier.isFeatured 
                        ? "border-primary bg-primary/[0.02] shadow-xl shadow-primary/10 relative" 
                        : "border-border/50 bg-card/30 backdrop-blur-sm"
                    )}
                  >
                    {tier.isFeatured && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold tracking-widest uppercase">
                        {t.mostPopular}
                      </div>
                    )}
                    <CardHeader className="p-8 pb-0">
                      <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                      <CardDescription className="text-base mt-2">{tier.description}</CardDescription>
                      <div className="mt-6 flex items-baseline gap-1">
                        <span className="text-5xl font-bold font-headline text-foreground">
                          {tier.price}
                        </span>
                        <span className="text-muted-foreground text-lg">
                          {tier.period}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 flex-grow">
                      <ul className="space-y-4">
                        {tier.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="p-8 pt-0">
                      <Button
                        asChild
                        size="lg"
                        className={cn(
                          "w-full rounded-2xl h-14 text-lg",
                          tier.isFeatured ? "bg-primary" : "bg-muted hover:bg-muted/80 text-foreground"
                        )}
                      >
                        <Link href={`/get-started?step=subscription&plan=${tier.id}`}>
                          {tier.cta}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>
        );
      case 'testimonial':
        return (
          <section key="testimonial" id="testimonial" className="relative py-24 rounded-[3rem] bg-secondary/20 overflow-hidden border border-border/50 group">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] pointer-events-none" />
            
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4 text-foreground">{t.testimonialTitle}</h2>
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
              </div>
            </div>

            <div className="px-4 md:px-12 relative z-10">
              {reviews.length > 0 ? (
                <Carousel
                    opts={{ align: 'start', loop: true }}
                    className="w-full max-w-4xl mx-auto relative"
                >
                    <CarouselContent>
                    {reviews.map((review) => (
                        <CarouselItem key={review.id} className="basis-full">
                          <div className="text-center px-4 md:px-16">
                              <Avatar className="w-24 h-24 mx-auto mb-8 border-4 border-background shadow-xl">
                                  <AvatarFallback className="text-2xl">{review.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <blockquote className="text-2xl md:text-3xl font-light italic leading-relaxed text-foreground">
                              "{review.review_text}"
                              </blockquote>
                              <div className="mt-8">
                                <p className="text-xl font-bold text-primary">{review.name}</p>
                                <p className="text-muted-foreground">{review.company}</p>
                              </div>
                          </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <div className="hidden md:block">
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-lg transition-all" />
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-lg transition-all" />
                    </div>
                </Carousel>
              ) : (
                <div className="max-w-3xl mx-auto text-center">
                    <blockquote className="text-2xl md:text-3xl font-light italic leading-relaxed text-foreground">
                    {lang === 'bn' 
                        ? "এই প্ল্যাটফর্মটি আমাদের ব্যবসাকে অবিশ্বাস্যভাবে সহজ করে দিয়েছে। এআই টুলস ব্যবহার করে আমরা মাত্র কয়েক ঘন্টায় আমাদের পুরো ইনভেন্টরি রেডি করতে পেরেছি।"
                        : "This platform has made our business incredibly easy. Using AI tools, we were able to get our entire inventory ready in just a few hours."
                    }
                    </blockquote>
                    <div className="mt-8">
                      <p className="text-xl font-bold text-primary">{lang === 'bn' ? "একজন সফল উদ্যোক্তা" : "A Successful Entrepreneur"}</p>
                    </div>
                </div>
              )}
            </div>
          </section>
        );
      case 'cta':
        return (
          <motion.section 
            key="cta"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[3rem] overflow-hidden py-20 px-8 text-center text-primary-foreground shadow-2xl"
            style={{ backgroundColor: settings?.cta_bg_color || 'hsl(var(--primary))' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[80px] rounded-full -ml-32 -mb-32" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-headline font-bold mb-6">
                {settings?.cta_title || t.ctaTitle}
              </h2>
              <p className="max-w-2xl mx-auto text-lg md:text-xl opacity-90 mb-10 leading-relaxed">
                {settings?.cta_description || t.ctaDesc}
              </p>
              <Button asChild size="lg" variant="secondary" className="h-14 px-10 rounded-full text-lg shadow-xl transition-transform hover:scale-105 active:scale-95">
                <Link href="/get-started">
                  {lang === 'bn' ? "এখনই শুরু করুন (সম্পূর্ণ ফ্রি)" : "Start Now (Completely Free)"}
                </Link>
              </Button>
              <p className="mt-6 text-sm opacity-70 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {t.ctaNoCredit}</span>
                <span className="flex items-center gap-1"><Smartphone className="w-4 h-4" /> {t.ctaMobile}</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {t.ctaDomain}</span>
              </p>
            </div>
          </motion.section>
        );
      default:
        return null;
    }
  };

  return (
    <div id="root-main" className="min-h-screen bg-background selection:bg-primary/30">
      <SaasHeader initialSettings={settings} lang={lang} />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-32">
        <div className="space-y-24 md:space-y-40 py-12 md:py-24">
          {sections.map(renderSection)}
        </div>
      </main>
      <SaasFooter initialSettings={settings} lang={lang} />
    </div>
  );
}
