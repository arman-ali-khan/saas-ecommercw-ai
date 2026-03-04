
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
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ArrowLeft, CreditCard, Wallet, CheckCircle2, ShieldCheck, ShoppingBag, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
    const { toast } = useToast();
    const [settings, setSettings] = useState<SaasSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentMethod: formData.paymentMethod || 'sslcommerz',
            transactionId: formData.transactionId || '',
        }
    });

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const { data } = await supabase.from('saas_settings').select('mobile_banking_enabled, mobile_banking_number, accepted_banking_methods').eq('id', 1).single();
                if (data) {
                    setSettings(data);
                }
            } catch (err) {
                console.error("Settings fetch error:", err);
            }
            setIsLoading(false);
        }
        fetchSettings();
    }, []);

    const paymentMethod = form.watch('paymentMethod');
    const priceText = plan?.price === 0 ? '0' : plan?.price.toFixed(2) || '0';
    const merchantNumber = settings?.mobile_banking_number || '...';
    
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
                    successUrl: `${origin}/get-started?step=domain&plan=${plan.id}&stripe_session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${origin}/get-started?step=payment&plan=${plan.id}`,
                }),
            });

            const result = await response.json();
            if (response.ok && result.url) {
                window.location.href = result.url;
            } else {
                throw new Error(result.error || 'Failed to start checkout');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Stripe Error', description: e.message });
            setIsNavigating(false);
        }
    }

    async function handleSSLCommerzCheckout() {
        if (!plan) return;
        setIsNavigating(true);
        
        try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const response = await fetch('/api/saas/payments/sslcommerz/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    amount: plan.price,
                    origin: origin
                }),
            });

            const result = await response.json();
            if (response.ok && result.url) {
                window.location.replace(result.url);
            } else {
                throw new Error(result.error || 'SSLCommerz initialization failed');
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'SSLCommerz Error', description: e.message });
            setIsNavigating(false);
        }
    }

    function onSubmit(values: z.infer<typeof paymentSchema>) {
        if (values.paymentMethod === 'credit_card') {
            handleStripeCheckout();
            return;
        }
        if (values.paymentMethod === 'sslcommerz') {
            handleSSLCommerzCheckout();
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
            <Card className="max-w-lg mx-auto border-2 rounded-[2.5rem]">
                <CardHeader className="text-center">
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-full mx-auto mt-2" />
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                    <Skeleton className="h-24 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="max-w-lg mx-auto border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center bg-muted/30 p-8 pb-10 border-b">
                <CardTitle className="text-2xl font-black font-headline">পেমেন্ট পদ্ধতি বেছে নিন</CardTitle>
                <CardDescription className="text-base mt-2">
                    আপনি <span className="font-bold text-primary">{plan.name}</span> প্ল্যানটি বেছে নিয়েছেন। সাবস্ক্রিপশন মূল্য: <span className="font-black text-foreground">৳{priceText}</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
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
                                                htmlFor="sslcommerz" 
                                                className={cn(
                                                    "flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300",
                                                    field.value === 'sslcommerz' ? "border-primary bg-primary/[0.03] shadow-md ring-4 ring-primary/5" : "border-border/50 hover:border-primary/20 hover:bg-muted/30"
                                                )}
                                            >
                                                <RadioGroupItem value="sslcommerz" id="sslcommerz" className="sr-only" />
                                                <div className="bg-primary/10 p-3 rounded-xl">
                                                    <ShoppingBag className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="text-lg font-bold">অনলাইন পেমেন্ট</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Cards, bKash, Nagad, Net Banking</p>
                                                </div>
                                                {field.value === 'sslcommerz' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                            </Label>

                                            <Label 
                                                htmlFor="credit_card" 
                                                className={cn(
                                                    "flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300",
                                                    field.value === 'credit_card' ? "border-blue-600 bg-blue-600/[0.03] shadow-md ring-4 ring-blue-600/5" : "border-border/50 hover:border-blue-600/20 hover:bg-muted/30"
                                                )}
                                            >
                                                <RadioGroupItem value="credit_card" id="credit_card" className="sr-only" />
                                                <div className="bg-blue-600/10 p-3 rounded-xl">
                                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="text-lg font-bold">ইন্টারন্যাশনাল কার্ড</p>
                                                    <p className="text-xs text-muted-foreground">Visa, Mastercard (Stripe Secure)</p>
                                                </div>
                                                {field.value === 'credit_card' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                                            </Label>

                                            <Label 
                                                htmlFor="mobile_banking" 
                                                className={cn(
                                                    "flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all duration-300",
                                                    field.value === 'mobile_banking' ? "border-primary bg-primary/[0.03] shadow-md ring-4 ring-primary/5" : "border-border/50 hover:border-primary/20 hover:bg-muted/30"
                                                )}
                                            >
                                                <RadioGroupItem value="mobile_banking" id="mobile_banking" className="sr-only" />
                                                <div className="bg-primary/10 p-3 rounded-xl">
                                                    <Wallet className="h-6 w-6 text-primary" />
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="text-lg font-bold">অন্যান্য পেমেন্ট</p>
                                                    <p className="text-xs text-muted-foreground">ম্যানুয়াল ভেরিফিকেশন</p>
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
                                <div className="text-sm text-muted-foreground bg-muted/50 p-6 rounded-[2rem] border-2 border-dashed">
                                    <h3 className="font-bold mb-4 text-foreground flex items-center gap-2">
                                        <Info className="h-4 w-4 text-primary" /> মোবাইল ব্যাংকিং নির্দেশনা
                                    </h3>
                                    <ol className="space-y-3 leading-relaxed font-medium">
                                        <li className="flex gap-2"><span>১.</span> আপনার মোবাইল ব্যাংকিং অ্যাপটি খুলুন।</li>
                                        <li className="flex gap-2"><span>২.</span> "পেমেন্ট" অপশন নির্বাচন করুন।</li>
                                        <li className="flex gap-2"><span>৩.</span> নম্বর হিসেবে <strong className="text-primary font-black">{merchantNumber}</strong> দিন।</li>
                                        <li className="flex gap-2"><span>৪.</span> টাকার পরিমাণ হিসেবে <strong className="text-primary font-black">৳{priceText}</strong> লিখুন।</li>
                                        <li className="flex gap-2"><span>৫.</span> পেমেন্ট শেষে ট্রানজেকশন আইডি নিচের বক্সে দিন।</li>
                                    </ol>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="transactionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground ml-1">Transaction ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. 8N7F6G5H4J" {...field} className="h-14 rounded-xl border-2 focus:border-primary text-xl font-mono font-bold tracking-tight" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button type="button" variant="outline" onClick={onBack} disabled={isNavigating} className="h-14 rounded-2xl flex-1 font-bold">
                                <ArrowLeft className="mr-2 h-4 w-4" /> পিছে ফিরে যান
                            </Button>
                            <Button type="submit" className="h-14 rounded-2xl flex-1 font-bold shadow-xl shadow-primary/20" disabled={isNavigating}>
                                {isNavigating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> প্রসেসিং...</> : 'পরবর্তী ধাপ'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
