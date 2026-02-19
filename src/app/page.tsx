'use client';

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
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { type Plan, type SaasFeature, type SaaSReview, type SaasShowcaseItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicIcon from '@/components/dynamic-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Showcase Carousel Component
function PlatformShowcase({ items, isLoading }: { items: SaasShowcaseItem[], isLoading: boolean }) {
  if (!isLoading && items.length === 0) return null;

  return (
    <section id="showcase" className="relative">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4">প্ল্যাটফর্ম শোকেস</h2>
        <p className="text-muted-foreground text-lg">আমাদের শক্তিশালী ড্যাশবোর্ড এবং ফিচারগুলোর এক ঝলক দেখে নিন।</p>
      </div>

      <div className="px-4">
        {isLoading ? (
          <Skeleton className="h-[400px] w-full max-w-5xl mx-auto rounded-3xl" />
        ) : (
          <div className="max-w-5xl mx-auto">
            <Carousel
              opts={{ align: 'start', loop: true }}
              className="w-full"
            >
              <CarouselContent>
                {items.map((item) => (
                  <CarouselItem key={item.id} className="basis-full">
                    <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden border-2 border-border/50 shadow-2xl group">
                      {item.image_url ? (
                        <Image 
                          src={item.image_url} 
                          alt={item.title} 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <DynamicIcon name={item.icon} className="w-20 h-20 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-12 text-white">
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <h3 className="text-2xl md:text-4xl font-bold font-headline mb-3">{item.title}</h3>
                          <p className="text-white/80 text-sm md:text-lg max-w-3xl line-clamp-2 md:line-clamp-none leading-relaxed">
                            {item.description}
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block">
                <CarouselPrevious className="-left-16 hover:bg-primary hover:text-primary-foreground border-primary/20" />
                <CarouselNext className="-right-16 hover:bg-primary hover:text-primary-foreground border-primary/20" />
              </div>
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}

export default function SaasLandingPage() {
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [features, setFeatures] = useState<SaasFeature[]>([]);
  const [reviews, setReviews] = useState<SaaSReview[]>([]);
  const [showcaseItems, setShowcaseItems] = useState<SaasShowcaseItem[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      const plansPromise = supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      const featuresPromise = supabase
        .from('saas_features')
        .select('*')
        .order('name', { ascending: true });

      const reviewsPromise = supabase
        .from('saas_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      const showcasePromise = supabase
        .from('saas_showcase')
        .select('*')
        .eq('is_enabled', true)
        .order('order', { ascending: true });

      const settingsPromise = supabase
        .from('saas_settings')
        .select('homepage_sections')
        .eq('id', 1)
        .single();

      const [
          { data: plans }, 
          { data: featuresData }, 
          { data: reviewsData },
          { data: showcaseData },
          { data: settingsData }
      ] = await Promise.all([plansPromise, featuresPromise, reviewsPromise, showcasePromise, settingsPromise]);

      if (plans) {
        const tiers = plans.map((plan: Plan) => ({
          name: plan.name,
          id: plan.id,
          price: plan.price === 0 ? 'Free' : `৳${plan.price}`,
          period: plan.period,
          description: plan.description,
          features: plan.features,
          cta:
            plan.id === 'enterprise'
              ? 'যোগাযোগ করুন'
              : plan.id === 'free'
                ? 'শুরু করুন'
                : 'প্রো বেছে নিন',
          isFeatured: plan.id === 'pro',
        }));
        setPricingTiers(tiers);
      }

      if (featuresData) {
        setFeatures(featuresData as SaasFeature[]);
      }

      if (reviewsData) {
        setReviews(reviewsData as SaaSReview[]);
      }
      
      if (showcaseData) {
        setShowcaseItems(showcaseData as SaasShowcaseItem[]);
      }

      if (settingsData?.homepage_sections && Array.isArray(settingsData.homepage_sections)) {
        setSections(settingsData.homepage_sections);
      } else {
        // Fallback default order
        setSections([
            { id: 'hero', enabled: true },
            { id: 'features', enabled: true },
            { id: 'showcase', enabled: true },
            { id: 'stats', enabled: true },
            { id: 'pricing', enabled: true },
            { id: 'testimonial', enabled: true },
            { id: 'cta', enabled: true }
        ]);
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

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
            className="text-center relative pt-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-pulse">
              <Zap className="w-3 h-3" />
              <span>নতুন: এআই প্রোডাক্ট ডেসক্রিপশন জেনারেটর এখন লাইভ!</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 mb-6">
              আপনার স্বপ্নের স্টোর <br className="hidden md:block" /> এখন বাস্তবের পথে
            </h1>
            
            <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
              বাংলা ন্যাচারালস-এর মাধ্যমে কয়েক মিনিটের মধ্যেই শুরু করুন আপনার নিজস্ব ই-কমার্স প্ল্যাটফর্ম। এআই-চালিত টুলস এবং কাস্টমাইজযোগ্য ডিজাইন নিয়ে আজই আপনার ব্র্যান্ড চালু করুন।
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
              <Button asChild size="lg" className="h-12 px-8 rounded-full text-lg shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                <Link href="/get-started">
                  ফ্রি ট্রায়াল শুরু করুন <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8 rounded-full text-lg backdrop-blur-sm bg-background/50 transition-transform hover:scale-105 active:scale-95">
                <Link href="#pricing">প্ল্যানগুলো দেখুন</Link>
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
                    src="https://images.unsplash.com/photo-1628882139032-a1314387532f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxlY29tbWVyY2UlMjBhcHB8ZW58MHx8fHwxNzcxMDQzODA2fDA&ixlib=rb-4.1.0&q=80&w=1200"
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
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4">সবকিছু যা আপনার প্রয়োজন</h2>
              <p className="text-muted-foreground text-lg">আধুনিক ই-কমার্স ব্যবসার জন্য প্রয়োজনীয় সকল ফিচার এখন এক জায়গায়।</p>
            </div>
            
            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {isLoading ? (
                [...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
              ) : (
                features.map((feature) => (
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
                ))
              )}
            </motion.div>
          </section>
        );
      case 'showcase':
        return <PlatformShowcase key="showcase" items={showcaseItems} isLoading={isLoading} />;
      case 'stats':
        return (
          <section key="stats" className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-border/50">
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2">১০০০+</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">সক্রিয় স্টোর</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2">৯৯.৯%</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">আপটাইম</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2">৫মিনিট</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">সেটআপ টাইম</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold font-headline mb-2">২৪/৭</div>
              <div className="text-sm text-muted-foreground uppercase tracking-widest">সাপোর্ট</div>
            </div>
          </section>
        );
      case 'pricing':
        return (
          <section key="pricing" id="pricing" className="relative scroll-mt-24">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4">স্বচ্ছ এবং সহজ প্রাইসিং</h2>
              <p className="text-muted-foreground text-lg">আপনার ব্যবসার আকার অনুযায়ী সেরা প্ল্যানটি বেছে নিন। কোনো লুকানো চার্জ নেই।</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 items-stretch">
              {isLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-[500px] rounded-3xl" />)
              ) : (
                pricingTiers.map((tier) => (
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
                          Most Popular
                        </div>
                      )}
                      <CardHeader className="p-8 pb-0">
                        <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                        <CardDescription className="text-base mt-2">{tier.description}</CardDescription>
                        <div className="mt-6 flex items-baseline gap-1">
                          <span className="text-5xl font-bold font-headline">
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
                ))
              )}
            </div>
          </section>
        );
      case 'testimonial':
        return (
          <section key="testimonial" id="testimonial" className="relative py-24 rounded-[3rem] bg-secondary/20 overflow-hidden border border-border/50">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] pointer-events-none" />
            
            <div className="text-center mb-16 relative z-10">
              <h2 className="text-3xl md:text-5xl font-headline font-bold mb-4">ইউজাররা যা বলছেন</h2>
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}
              </div>
            </div>

            <div className="px-4 md:px-12 relative z-10">
              {isLoading ? (
                <Skeleton className="h-64 w-full max-w-3xl mx-auto rounded-3xl" />
              ) : reviews.length > 0 ? (
                <Carousel
                    opts={{ align: 'start', loop: true }}
                    className="w-full max-w-4xl mx-auto"
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
                    <CarouselPrevious className="hidden md:flex -left-12" />
                    <CarouselNext className="hidden md:flex -right-12" />
                </Carousel>
              ) : (
                <div className="max-w-3xl mx-auto text-center">
                    <blockquote className="text-2xl md:text-3xl font-light italic leading-relaxed">
                    "এই প্ল্যাটফর্মটি আমাদের ব্যবসাকে অবিশ্বাস্যভাবে সহজ করে দিয়েছে। এআই টুলস ব্যবহার করে আমরা মাত্র কয়েক ঘন্টায় আমাদের পুরো ইনভেন্টরি রেডি করতে পেরেছি।"
                    </blockquote>
                    <div className="mt-8">
                      <p className="text-xl font-bold text-primary">একজন সফল উদ্যোক্তা</p>
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
            className="relative rounded-[3rem] bg-primary overflow-hidden py-20 px-8 text-center text-primary-foreground shadow-2xl shadow-primary/20"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[80px] rounded-full -ml-32 -mb-32" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-headline font-bold mb-6">আপনার অনলাইন যাত্রা আজই শুরু হোক</h2>
              <p className="max-w-2xl mx-auto text-lg md:text-xl opacity-90 mb-10 leading-relaxed">
                হাজার হাজার উদ্যোক্তার সাথে যোগ দিন যারা বাংলা ন্যাচারালস ব্যবহার করে তাদের ব্র্যান্ডকে সফলভাবে গড়ে তুলছেন।
              </p>
              <Button asChild size="lg" variant="secondary" className="h-14 px-10 rounded-full text-lg shadow-xl transition-transform hover:scale-105 active:scale-95">
                <Link href="/get-started">
                  এখনই শুরু করুন (সম্পূর্ণ ফ্রি)
                </Link>
              </Button>
              <p className="mt-6 text-sm opacity-70 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> ক্রেডিট কার্ড লাগবে না</span>
                <span className="flex items-center gap-1"><Smartphone className="w-4 h-4" /> মোবাইল অ্যাপ এক্সপেরিয়েন্স</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> কাস্টম ডোমেইন</span>
              </p>
            </div>
          </motion.section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <SaasHeader />
      
      {/* Background blobs for modern feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-24 md:space-y-40 py-12 md:py-24">
          {sections.map(renderSection)}
        </div>
      </main>
      <SaasFooter />
    </div>
  );
}
