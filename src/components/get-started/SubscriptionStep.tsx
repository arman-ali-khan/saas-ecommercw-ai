
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
import { CheckCircle2, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import type { FormData } from '@/components/get-started/GetStartedFlow';
import { useState } from 'react';
import { type Plan } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SubscriptionStepProps {
  plans: Plan[];
  isLoading: boolean;
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function SubscriptionStep({
  plans,
  isLoading,
  formData,
  updateFormData,
  onNext,
  onBack,
}: SubscriptionStepProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSelectPlan = (planId: string) => {
    updateFormData({ plan: planId });
  };

  const handleNext = () => {
    setIsNavigating(true);
    onNext();
  };

  if (isLoading) {
    return (
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto rounded-full" />
          <Skeleton className="h-6 w-96 mx-auto rounded-full" />
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[500px] w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-headline font-black tracking-tight">আপনার উপযুক্ত প্ল্যানটি বেছে নিন</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          আপনার ব্যবসার আকার এবং লক্ষ্য অনুযায়ী সেরা সাবস্ক্রিপশন প্ল্যানটি নির্বাচন করুন।
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((tier) => {
          const isSelected = formData.plan === tier.id;
          const isFeatured = tier.id === 'pro';

          return (
            <Card
              key={tier.id}
              className={cn(
                "relative flex flex-col rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden",
                isSelected 
                  ? "border-primary bg-primary/[0.03] shadow-2xl ring-4 ring-primary/10 -translate-y-2" 
                  : "border-border/50 bg-card/50 hover:border-primary/20 hover:bg-card",
                isFeatured && !isSelected ? "border-primary/30" : ""
              )}
            >
              {isFeatured && (
                <div className="absolute top-0 right-0">
                    <div className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest px-6 py-1.5 rounded-bl-2xl shadow-lg flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" /> জনপ্রিয়
                    </div>
                </div>
              )}

              <CardHeader className="p-8">
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <CardDescription className="text-sm mt-2">{tier.description}</CardDescription>
                <div className="pt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-black font-headline text-foreground">
                    {tier.price === 0 ? 'ফ্রি' : `৳${tier.price}`}
                  </span>
                  {tier.period && (
                    <span className="text-muted-foreground text-lg font-medium">{tier.period}</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0 flex-grow">
                <ul className="space-y-4">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="p-8 pt-0">
                <Button
                  onClick={() => handleSelectPlan(tier.id)}
                  className={cn(
                    "w-full h-14 rounded-2xl text-lg font-bold shadow-lg transition-all active:scale-95",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                  variant={isSelected ? 'default' : 'secondary'}
                >
                  {isSelected ? 'নির্বাচিত হয়েছে' : (tier.id === 'enterprise' ? 'যোগাযোগ করুন' : 'এই প্ল্যানটি বেছে নিন')}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
        <Button size="lg" variant="ghost" onClick={onBack} disabled={isNavigating} className="rounded-full px-8 h-12">
          <ArrowLeft className="mr-2 h-4 w-4" /> হোমপেজে ফিরে যান
        </Button>
        <Button size="lg" onClick={handleNext} disabled={!formData.plan || isNavigating} className="rounded-full px-12 h-12 font-bold shadow-xl shadow-primary/20">
          {isNavigating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> প্রসেসিং...</> : 'পরবর্তী ধাপ'}
        </Button>
      </div>
    </div>
  );
}
