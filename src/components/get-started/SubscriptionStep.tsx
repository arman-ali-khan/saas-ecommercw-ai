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
import { CheckCircle, Loader2 } from 'lucide-react';
import type { FormData } from '@/components/get-started/GetStartedFlow';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { type Plan } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionStepProps {
  plans: Plan[];
  isLoading: boolean;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
}

export default function SubscriptionStep({
  plans,
  isLoading,
  formData,
  updateFormData,
  onNext,
}: SubscriptionStepProps) {
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const planFromQuery = searchParams.get('plan');
    if (planFromQuery && plans.some(p => p.id === planFromQuery)) {
      updateFormData({ plan: planFromQuery });
    }
  }, [searchParams, updateFormData, plans]);

  const handleSelectPlan = (planId: string) => {
    updateFormData({ plan: planId });
  };

  const handleNext = () => {
    setIsNavigating(true);
    onNext();
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
        {plans.map((tier) => (
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
                  {tier.price === 0 ? 'বিনামূল্যে' : `৳ ${tier.price}`}
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
                onClick={() => handleSelectPlan(tier.id)}
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
        <Button size="lg" onClick={handleNext} disabled={!formData.plan || isNavigating}>
          {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          পরবর্তী ধাপ
        </Button>
      </div>
    </div>
  );
}
