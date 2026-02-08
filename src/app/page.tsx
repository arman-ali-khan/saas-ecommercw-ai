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
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  ArrowRight,
  CheckCircle,
  Package,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';
import SaasHeader from '@/components/saas-header';
import SaasFooter from '@/components/saas-footer';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { type Plan } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function SaasLandingPage() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'saas-hero');
  const avatarImage = PlaceHolderImages.find(
    (img) => img.id === 'saas-avatar-1'
  );
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (plans) {
        const tiers = plans.map((plan) => ({
          name: plan.name,
          id: plan.id,
          price: plan.price,
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
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  const features = [
    {
      icon: Store,
      title: 'আপনার নিজস্ব ব্র্যান্ডেড স্টোর',
      description:
        'মাত্র কয়েক ক্লিকে আপনার নিজস্ব কাস্টমাইজযোগ্য এবং ব্যক্তিগতকৃত ই-কমার্স স্টোর তৈরি করুন।',
    },
    {
      icon: Package,
      title: 'সহজ পণ্য ব্যবস্থাপনা',
      description:
        'আমাদের স্বজ্ঞাত ইন্টারফেসের মাধ্যমে সহজেই আপনার পণ্য যোগ করুন, সম্পাদনা করুন এবং সংগঠিত করুন।',
    },
    {
      icon: Sparkles,
      title: 'এআই-চালিত সরঞ্জাম',
      description:
        'পণ্যের বিবরণ এবং বিপণন বার্তা তৈরি করতে কৃত্রিম বুদ্ধিমত্তার শক্তি ব্যবহার করুন।',
    },
    {
      icon: Users,
      title: 'ব্যক্তিগতকৃত গ্রাহক পৃষ্ঠা',
      description:
        'আপনার গ্রাহকদের জন্য অনন্য পৃষ্ঠা তৈরি করুন, যা তাদের একটি বিশেষ অভিজ্ঞতা প্রদান করবে।',
    },
  ];

  return (
    <>
      <SaasHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-24 md:space-y-32 py-8">
          {/* Hero Section */}
          <section className="text-center pt-16">
            <h1 className="text-4xl md:text-6xl font-headline font-bold">
              আপনার নিজস্ব ই-কমার্স সাম্রাজ্য তৈরি করুন
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
              বাংলা ন্যাচারালস স্যাস প্ল্যাটফর্ম আপনাকে একটি শক্তিশালী,
              ব্যক্তিগতকৃত এবং এআই-চালিত অনলাইন স্টোর চালু করার ক্ষমতা দেয়।
              আজই আপনার ব্র্যান্ড তৈরি শুরু করুন।
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/get-started">
                  বিনামূল্যে শুরু করুন <ArrowRight className="ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="#pricing">মূল্য দেখুন</Link>
              </Button>
            </div>
            <div className="mt-12 -mx-4 sm:-mx-6 lg:-mx-8">
              {heroImage && (
                <div className="relative h-[50vh] w-full shadow-2xl shadow-primary/20 rounded-lg overflow-hidden">
                  <Image
                    src={heroImage.imageUrl}
                    alt={heroImage.description}
                    data-ai-hint={heroImage.imageHint}
                    fill
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
                </div>
              )}
            </div>
          </section>

          {/* Features Section */}
          <section id="features">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                আপনার সাফল্যের জন্য নির্মিত
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                আপনার অনলাইন ব্যবসাকে পরবর্তী স্তরে নিয়ে যাওয়ার জন্য প্রয়োজনীয়
                সমস্ত সরঞ্জাম।
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardHeader className="items-center">
                    <div className="bg-primary/10 p-4 rounded-full">
                      <feature.icon className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Pricing Section */}
          <section id="pricing">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">
                আপনার জন্য সঠিক পরিকল্পনা
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                সহজ এবং স্বচ্ছ মূল্য নির্ধারণ। যেকোনো সময় বাতিল করুন।
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
            <div className="max-w-3xl mx-auto text-center">
              {avatarImage && (
                <Image
                  src={avatarImage.imageUrl}
                  alt={avatarImage.description}
                  data-ai-hint={avatarImage.imageHint}
                  width={80}
                  height={80}
                  className="mx-auto rounded-full mb-4"
                />
              )}
              <blockquote className="text-xl md:text-2xl font-light text-foreground">
                "বাংলা ন্যাচারালস প্ল্যাটফর্ম আমাদের ব্যবসাকে পুরোপুরি বদলে
                দিয়েছে। এটি ব্যবহার করা সহজ, এবং এআই সরঞ্জামগুলি আমাদের অনেক
                সময় বাঁচিয়েছে। অত্যন্ত সুপারিশযোগ্য!"
              </blockquote>
              <p className="mt-6 font-semibold text-primary">— একজন সুখী গ্রাহক</p>
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center">
            <h2 className="text-3xl md:text-4xl font-headline font-bold">
              আজই আপনার অনলাইন স্টোর তৈরি করতে প্রস্তুত?
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              হাজার হাজার উদ্যোক্তার সাথে যোগ দিন যারা বাংলা ন্যাচারালস-কে তাদের
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
