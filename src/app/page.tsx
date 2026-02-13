
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
} from 'lucide-react';
import SaasHeader from '@/components/saas-header';
import SaasFooter from '@/components/saas-footer';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { type Plan, type SaasFeature, type SaaSReview } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import DynamicIcon from '@/components/dynamic-icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

export default function SaasLandingPage() {
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [features, setFeatures] = useState<SaasFeature[]>([]);
  const [reviews, setReviews] = useState<SaaSReview[]>([]);
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

      const [
          { data: plans }, 
          { data: featuresData }, 
          { data: reviewsData }
      ] = await Promise.all([plansPromise, featuresPromise, reviewsPromise]);

      if (plans) {
        const tiers = plans.map((plan: Plan) => ({
          name: plan.name,
          id: plan.id,
          price: plan.price === 0 ? 'বিনামূল্যে' : `৳ ${plan.price}`,
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

      setIsLoading(false);
    };
    fetchData();
  }, []);

  return (
    <>
      <SaasHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-24 md:space-y-32 py-8">
          {/* Hero Section */}
          <section className="text-center pt-16">
            <h1 className="text-4xl md:text-6xl font-headline font-bold">
              আপনার নিজের ই-কমার্স প্ল্যাটফর্ম তৈরি করুন
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              আমাদের প্ল্যাটফর্ম আপনাকে একটি শক্তিশালী,
              পার্সোনালাইজড এবং এআই-চালিত অনলাইন স্টোর চালু করার ক্ষমতা দেয়।
              আজই আপনার ব্র্যান্ড তৈরি শুরু করুন।
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/get-started">
                  বিনামূল্যে শুরু করুন <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#pricing">প্রাইসিং দেখুন</Link>
              </Button>
            </div>
            <div className="mt-12 -mx-4 sm:-mx-6 lg:-mx-8">
                <div className="relative h-[50vh] w-full shadow-2xl shadow-primary/20 rounded-lg overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1628882139032-a1314387532f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxlY29tbWVyY2UlMjB3ZWJzaXRlJTIwaGVybyUyMGltYWdlfGVufDB8fHx8MTc3MTA0MzgwNnww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="SaaS Platform Showcase"
                    data-ai-hint="ecommerce website"
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                আপনার সাফল্যের জন্য নির্মিত
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                আপনার অনলাইন ব্যবসাকে পরবর্তী লেভেলে নিয়ে যাওয়ার জন্য প্রয়োজনীয়
                সমস্ত টুলস।
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {isLoading ? (
                [...Array(4)].map((_, index) => (
                  <Card key={index}>
                    <CardHeader className="items-center text-center">
                      <Skeleton className="h-20 w-20 rounded-full" />
                      <Skeleton className="h-6 w-3/4 mt-4" />
                    </CardHeader>
                    <CardContent className="text-center">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6 mt-2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                features.map((feature) => (
                  <Card key={feature.id} className="text-center">
                    <CardHeader className="items-center">
                      <div className="bg-primary/10 p-4 rounded-full">
                        <DynamicIcon name={feature.icon} className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="mt-4">{feature.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                আপনার জন্য সঠিক প্ল্যান
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                সহজ এবং স্বচ্ছ প্রাইসিং। যেকোনো সময় বাতিল করুন।
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {isLoading ? (
                <>
                  <Skeleton className="h-96 w-full" />
                  <Skeleton className="h-96 w-full" />
                  <Skeleton className="h-96 w-full" />
                </>
              ) : (
                pricingTiers.map((tier) => (
                  <Card
                    key={tier.id}
                    className={
                      tier.isFeatured ? 'border-primary ring-2 ring-primary' : ''
                    }
                  >
                    <CardHeader>
                      <CardTitle>{tier.name}</CardTitle>
                      <CardDescription>{tier.description}</CardDescription>
                      <div className="pt-4">
                        <span className="text-4xl font-bold font-headline">
                          {tier.price}
                        </span>
                        <span className="text-muted-foreground">
                          {tier.period}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-3">
                        {tier.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button
                        asChild
                        className="w-full"
                        variant={tier.isFeatured ? 'default' : 'secondary'}
                      >
                        <Link
                          href={`/get-started?step=subscription&plan=${tier.id}`}
                        >
                          {tier.cta}
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Testimonial Section */}
          <section
            id="testimonial"
            className="bg-secondary/30 rounded-xl py-16 px-8"
          >
            {isLoading ? <Skeleton className="h-48 w-full max-w-3xl mx-auto" /> : (
                reviews.length > 0 ? (
                <Carousel
                    opts={{ align: 'start', loop: true }}
                    className="w-full max-w-3xl mx-auto"
                >
                    <CarouselContent>
                    {reviews.map((review) => (
                        <CarouselItem key={review.id}>
                        <div className="text-center">
                            <Avatar className="w-20 h-20 mx-auto mb-4">
                                <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex justify-center gap-1 mb-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30"} />
                                ))}
                            </div>
                            <blockquote className="text-xl md:text-2xl font-light text-foreground">
                            "{review.review_text}"
                            </blockquote>
                            <p className="mt-6 font-semibold text-primary">— {review.name} <span className="text-muted-foreground font-normal">{review.company && `, ${review.company}`}</span></p>
                        </div>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
                </Carousel>
                ) : (
                <div className="max-w-3xl mx-auto text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                        <AvatarFallback>স</AvatarFallback>
                    </Avatar>
                    <blockquote className="text-xl md:text-2xl font-light text-foreground">
                    "এই প্ল্যাটফর্মটি আমাদের ব্যবসাকে পুরোপুরি বদলে
                    দিয়েছে। এটি ব্যবহার করা সহজ, এবং এআই সরঞ্জামগুলি আমাদের অনেক
                    সময় বাঁচিয়েছে। অত্যন্ত সুপারিশযোগ্য!"
                    </blockquote>
                    <p className="mt-6 font-semibold text-primary">— একজন সুখী গ্রাহক</p>
                </div>
                )
            )}
          </section>

          {/* Final CTA */}
          <section className="text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              আজই আপনার অনলাইন স্টোর তৈরি করতে প্রস্তুত?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              হাজার হাজার উদ্যোক্তার সাথে যোগ দিন যারা এই প্ল্যাটফর্মকে তাদের
              ব্র্যান্ড তৈরি এবং ব্যবসা বাড়াতে বিশ্বাস করে।
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/get-started">
                  বিনামূল্যে শুরু করুন <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </main>
      <SaasFooter />
    </>
  );
}
