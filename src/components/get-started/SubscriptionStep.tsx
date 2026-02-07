'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import type { FormData } from "@/app/get-started/page";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface SubscriptionStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
}

const pricingTiers = [
    {
        name: 'শুরু',
        id: 'free',
        price: 'বিনামূল্যে',
        period: '',
        description: 'আপনার যাত্রা শুরু করার জন্য আদর্শ।',
        features: [
            '১০টি পণ্য পর্যন্ত',
            'বেসিক স্টোর কাস্টমাইজেশন',
            'ব্যক্তিগত ব্যবহারকারীর পৃষ্ঠা',
        ],
        isFeatured: false,
    },
    {
        name: 'প্রো',
        id: 'pro',
        price: '৳ ৯৯৯',
        period: '/মাস',
        description: 'আপনার ব্যবসা বাড়ানোর জন্য শক্তিশালী সরঞ্জাম।',
        features: [
            'সীমাহীন পণ্য',
            'উন্নত কাস্টমাইজেশন',
            'এআই-চালিত সরঞ্জাম',
            'অগ্রাধিকার সমর্থন',
        ],
        isFeatured: true,
    },
    {
        name: 'এন্টারপ্রাইজ',
        id: 'enterprise',
        price: 'কাস্টম',
        period: '',
        description: 'বড় আকারের ব্যবসার জন্য উপযুক্ত সমাধান।',
        features: [
            'প্রো-এর সবকিছু',
            'ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার',
            'কাস্টম ইন্টিগ্রেশন',
            'এসএলএ',
        ],
        isFeatured: false,
    },
];


export default function SubscriptionStep({ formData, updateFormData, onNext }: SubscriptionStepProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    useEffect(() => {
        const plan = searchParams.get('plan');
        if (plan === 'free' || plan === 'pro' || plan === 'enterprise') {
            updateFormData({ plan });
        }
    }, [searchParams, updateFormData]);

    const handleSelectPlan = (planId: 'free' | 'pro' | 'enterprise') => {
        updateFormData({ plan: planId });
    };

    return (
        <div>
            <div className="text-center mb-12">
                <h1 className="text-4xl font-headline font-bold">একটি প্ল্যান বেছে নিন</h1>
                <p className="mt-4 text-lg text-muted-foreground">আপনার প্রয়োজনের জন্য সেরা প্ল্যানটি বেছে নিন।</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                {pricingTiers.map((tier) => (
                    <Card key={tier.id} className={formData.plan === tier.id ? 'border-primary ring-2 ring-primary' : tier.isFeatured ? 'border-primary' : ''}>
                        <CardHeader>
                            <CardTitle>{tier.name}</CardTitle>
                            <CardDescription>{tier.description}</CardDescription>
                            <div className="pt-4">
                                <span className="text-4xl font-bold font-headline">{tier.price}</span>
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
                            <Button onClick={() => handleSelectPlan(tier.id as any)} className="w-full" variant={formData.plan === tier.id ? 'default' : 'secondary'}>
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
