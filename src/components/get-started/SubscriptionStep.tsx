'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import type { FormData } from '@/app/get-started/page';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { type Plan } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionStepProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
}

export default function SubscriptionStep({
  formData,
  updateFormData,
  onNext,
}: SubscriptionStepProps) {
  const searchParams = useSearchParams();
  const [pricingTiers, setPricingTiers] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      if (data) {
        setPricingTiers(data);
      }
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan === 'free' || plan === 'pro' || plan === 'enterprise') {
      updateFormData({ plan });
    }
  }, [searchParams, updateFormData]);

  const handleSelectPlan = (planId: 'free' | 'pro' | 'enterprise') => {
    updateFormData({ plan: planId });
  };

  if (isLoading) {
    return (
      <div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-headline font-bold">একটি প্ল্যান বেছে নিন</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            আপনার প্রয়োজনের জন্য সেরা প্ল্যানটি বেছে নিন।
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold">একটি প্ল্যান বেছে নিন</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          আপনার প্রয়োজনের জন্য সেরা প্ল্যানটি বেছে নিন।
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {pricingTiers.map((tier) => (
          <Card
            key={tier.id}
            className={
              formData.plan === tier.id
                ? 'border-primary ring-2 ring-primary'
                : tier.id === 'pro'
                  ? 'border-primary'
                  : ''
            }
          >
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold font-headline">
                  {tier.price}
                </span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSelectPlan(tier.id as any)}
                className="w-full"
                variant={formData.plan === tier.id ? 'default' : 'secondary'}
              >
                {formData.plan === tier.id ? 'নির্বাচিত' : 'এই প্ল্যানটি বেছে নিন'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <div className="mt-12 text-center">
        <Button size="lg" onClick={onNext} disabled={!formData.plan}>
          পরবর্তী ধাপ
        </Button>
      </div>
    </div>
  );
}
