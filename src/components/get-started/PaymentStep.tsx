'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { FormData } from "@/components/get-started/GetStartedFlow";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Plan } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";
import { getStripe } from "@/lib/stripe";

interface PaymentStepProps {
    plan?: Plan;
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const paymentSchema = z.object({
    paymentMethod: z.string({ required_error: 'A payment method is required.' }),
    transactionId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'mobile_banking') {
        return !!data.transactionId && data.transactionId.trim() !== '';
    }
    return true;
}, {
    message: 'ট্রানজেকশন আইডি প্রয়োজন।',
    path: ['transactionId'],
});

type SaasSettings = {
    mobile_banking_enabled: boolean;
    mobile_banking_number: string | null;
    accepted_banking_methods: string[] | null;
}

export default function PaymentStep({ plan, formData, updateFormData, onNext, onBack }: PaymentStepProps) {
    const [settings, setSettings] = useState<SaasSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentMethod: formData.paymentMethod || 'credit_card',
            transactionId: formData.transactionId || '',
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data } = await supabase.from('saas_settings').select('mobile_banking_enabled, mobile_banking_number, accepted_banking_methods').eq('id', 1).single();
            if (data) {
                setSettings(data);
            }
            setIsLoading(false);
        }
        fetchSettings();
    }, []);

    const paymentMethod = form.watch('paymentMethod');
    const priceText = plan?.price === 0 ? '0' : plan?.price.toFixed(2) || '0';
    const merchantNumber = settings?.mobile_banking_number || '...';
    
    const acceptedMethods = useMemo(() => {
        if (!settings?.accepted_banking_methods || settings.accepted_banking_methods.length === 0) {
            return 'বিকাশ, নগদ, ইত্যাদি';
        }
        return settings.accepted_banking_methods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
    }, [settings]);


    async function handleStripeCheckout() {
        if (!plan) return;
        setIsNavigating(true);
        
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const response = await fetch('/api/saas/payments/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    planName: plan.name,
                    amount: plan.price,
                    successUrl: `${origin}/get-started?step=domain&stripe_session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${origin}/get-started?step=payment`,
                }),
            });

            const { url, error } = await response.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error(error || 'Failed to start checkout');
            }
        } catch (e: any) {
            console.error(e);
            setIsNavigating(false);
        }
    }

    function onSubmit(values: z.infer<typeof paymentSchema>) {
        if (values.paymentMethod === 'credit_card') {
            handleStripeCheckout();
            return;
        }

        setIsNavigating(true);
        updateFormData({
            paymentMethod: values.paymentMethod,
            transactionId: values.transactionId,
        })
        onNext();
    }

    if (isLoading || !plan) {
        return (
            <Card className="max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-full mx-auto mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="max-w-lg mx-auto border-2 shadow-xl rounded-[2rem]">
            <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-black">পেমেন্ট পদ্ধতি বেছে নিন</CardTitle>
                <CardDescription className="text-base mt-2">
                    আপনি <span className="font-bold text-primary">{plan.name}</span> প্ল্যানটি বেছে নিয়েছেন (৳{priceText})।
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-1 gap-4"
                                        >
                                            <Label 
                                                htmlFor="credit_card" 
                                                className={cn(
                                                    "flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all",
                                                    field.value === 'credit_card' ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" : "border-muted hover:border-primary/30"
                                                )}
                                            >
                                                <RadioGroupItem value="credit_card" id="credit_card" className="sr-only" />
                                                <div className="bg-primary/10 p-3 rounded-xl">
                                                    <CreditCard className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="text-lg font-bold">ক্রেডিট বা ডেবিট কার্ড</p>
                                                    <p className="text-xs text-muted-foreground">Visa, Mastercard, etc. (Stripe Secure)</p>
                                                </div>
                                                {field.value === 'credit_card' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                            </Label>

                                            <Label 
                                                htmlFor="mobile_banking" 
                                                className={cn(
                                                    "flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all",
                                                    field.value === 'mobile_banking' ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20" : "border-muted hover:border-primary/30"
                                                )}
                                            >
                                                <RadioGroupItem value="mobile_banking" id="mobile_banking" className="sr-only" />
                                                <div className="bg-primary/10 p-3 rounded-xl">
                                                    <Wallet className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="text-lg font-bold">মোবাইল ব্যাংকিং (ম্যানুয়াল)</p>
                                                    <p className="text-xs text-muted-foreground">বিকাশ, নগদ বা রকেটের মাধ্যমে</p>
                                                </div>
                                                {field.value === 'mobile_banking' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                            </Label>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {paymentMethod === 'mobile_banking' && (
                             <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-4 duration-500">
                                <div className="text-sm text-muted-foreground bg-muted/50 p-5 rounded-2xl border-2 border-dashed">
                                    <h3 className="font-bold mb-3 text-foreground flex items-center gap-2">
                                        <InfoIcon className="h-4 w-4 text-primary" /> মোবাইল ব্যাংকিং নির্দেশনা
                                    </h3>
                                    <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                                        <li>আপনার পছন্দের মোবাইল ব্যাংকিং অ্যাপ ({acceptedMethods}) খুলুন।</li>
                                        <li>"পেমেন্ট" অপশন নির্বাচন করুন।</li>
                                        <li>মার্চেন্ট নম্বর হিসেবে <strong>{merchantNumber}</strong> দিন।</li>
                                        <li>টাকার পরিমাণ হিসেবে <strong>৳{priceText}</strong> লিখুন।</li>
                                        <li>পেমেন্ট সম্পন্ন করে নিচের বক্সে ট্রানজেকশন আইডি দিন।</li>
                                    </ol>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="transactionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">ট্রানজেকশন আইডি (TxnID)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="যেমন: 8N7F6G5H4J" {...field} className="h-12 rounded-xl border-2 focus:border-primary text-lg font-mono font-bold" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button type="button" variant="outline" onClick={onBack} disabled={isNavigating} className="h-12 rounded-xl flex-1 font-bold">
                                <ArrowLeft className="mr-2 h-4 w-4" /> পিছে ফিরে যান
                            </Button>
                            <Button type="submit" className="h-12 rounded-xl flex-1 font-bold shadow-lg shadow-primary/20" disabled={isNavigating}>
                                {isNavigating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> প্রসেসিং...</> : 'পরবর্তী ধাপ'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

const InfoIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
);
