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
import { Loader2, ArrowLeft, CreditCard, Wallet, CheckCircle2, ShoppingBag, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface PaymentStepProps {
    plan?: Plan;
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
    onBack: () => void;
    lang: 'en' | 'bn';
}

const translations = {
    bn: {
        title: "পেমেন্ট পদ্ধতি বেছে নিন",
        desc: "আপনি {planName} প্ল্যানটি বেছে নিয়েছেন। সাবস্ক্রিপশন মূল্য: ৳{price}",
        online: "অনলাইন পেমেন্ট",
        onlineDesc: "Cards, bKash, Nagad, Net Banking",
        intlCard: "ইন্টারন্যাশনাল কার্ড",
        intlDesc: "Visa, Mastercard (Stripe Secure)",
        other: "অন্যান্য পেমেন্ট",
        otherDesc: "ম্যানুয়াল ভেরিফিকেশন",
        guideTitle: "মোবাইল ব্যাংকিং নির্দেশনা",
        step1: "আপনার মোবাইল ব্যাংকিং অ্যাপটি খুলুন।",
        step2: "\"পেমেন্ট\" অপশন নির্বাচন করুন।",
        step3: "নম্বর হিসেবে {num} দিন।",
        step4: "টাকার পরিমাণ হিসেবে ৳{price} লিখুন।",
        step5: "পেমেন্ট শেষে ট্রানজেকশন আইডি নিচের বক্সে দিন।",
        trxLabel: "Transaction ID",
        back: "পিছে ফিরে যান",
        next: "পরবর্তী ধাপ",
        processing: "প্রসেসিং..."
    },
    en: {
        title: "Choose Payment Method",
        desc: "You have selected the {planName} plan. Subscription Price: ৳{price}",
        online: "Online Payment",
        onlineDesc: "Cards, bKash, Nagad, Net Banking",
        intlCard: "International Cards",
        intlDesc: "Visa, Mastercard (Stripe Secure)",
        other: "Manual Payment",
        otherDesc: "Manual Verification",
        guideTitle: "Payment Instructions",
        step1: "Open your mobile banking app.",
        step2: "Select the \"Payment\" option.",
        step3: "Enter this number: {num}",
        step4: "Enter amount: ৳{price}",
        step5: "After payment, enter the Transaction ID below.",
        trxLabel: "Transaction ID",
        back: "Go Back",
        next: "Next Step",
        processing: "Processing..."
    }
};

const paymentSchema = z.object({
    paymentMethod: z.string({ required_error: 'A payment method is required.' }),
    transactionId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'mobile_banking') {
        return !!data.transactionId && data.transactionId.trim() !== '';
    }
    return true;
}, {
    message: 'Transaction ID is required.',
    path: ['transactionId'],
});

export default function PaymentStep({ plan, formData, updateFormData, onNext, onBack, lang }: PaymentStepProps) {
    const { toast } = useToast();
    const [settings, setSettings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const t = translations[lang];

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
                const { data } = await supabase.from('saas_settings').select('*').eq('id', 1).single();
                if (data) setSettings(data);
            } catch (err) { console.error(err); }
            setIsLoading(false);
        }
        fetchSettings();
    }, []);

    const paymentMethod = form.watch('paymentMethod');
    const priceText = plan?.price === 0 ? '0' : plan?.price.toFixed(2) || '0';
    const planName = lang === 'en' ? (plan as any)?.name_en || plan?.name : plan?.name;
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
                    planName: planName,
                    amount: plan.price,
                    successUrl: `${origin}/get-started?step=domain&plan=${plan.id}&stripe_session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${origin}/get-started?step=payment&plan=${plan.id}`,
                }),
            });
            const result = await response.json();
            if (response.ok && result.url) window.location.href = result.url;
            else throw new Error(result.error);
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
                body: JSON.stringify({ planId: plan.id, amount: plan.price, origin: origin }),
            });
            const result = await response.json();
            if (response.ok && result.url) window.location.replace(result.url);
            else throw new Error(result.error);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Payment Error', description: e.message });
            setIsNavigating(false);
        }
    }

    function onSubmit(values: z.infer<typeof paymentSchema>) {
        if (values.paymentMethod === 'credit_card') { handleStripeCheckout(); return; }
        if (values.paymentMethod === 'sslcommerz') { handleSSLCommerzCheckout(); return; }
        setIsNavigating(true);
        updateFormData({ paymentMethod: values.paymentMethod, transactionId: values.transactionId });
        onNext();
    }

    if (isLoading || !plan) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card className="max-w-lg mx-auto border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center bg-muted/30 p-8 pb-10 border-b">
                <CardTitle className="text-2xl font-black font-headline">{t.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                    {t.desc.replace('{planName}', planName).replace('{price}', priceText)}
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
                                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 gap-4">
                                            <Label htmlFor="ssl" className={cn("flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all", field.value === 'sslcommerz' ? "border-primary bg-primary/[0.03] shadow-md" : "border-border/50 hover:bg-muted/30")}>
                                                <RadioGroupItem value="sslcommerz" id="ssl" className="sr-only" />
                                                <div className="bg-primary/10 p-3 rounded-xl"><ShoppingBag className="h-6 w-6 text-primary" /></div>
                                                <div className="flex-grow"><p className="text-lg font-bold">{t.online}</p><p className="text-[10px] text-muted-foreground uppercase font-black">{t.onlineDesc}</p></div>
                                                {field.value === 'sslcommerz' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                            </Label>
                                            <Label htmlFor="stripe" className={cn("flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all", field.value === 'credit_card' ? "border-blue-600 bg-blue-600/[0.03] shadow-md" : "border-border/50 hover:bg-muted/30")}>
                                                <RadioGroupItem value="credit_card" id="stripe" className="sr-only" />
                                                <div className="bg-blue-600/10 p-3 rounded-xl"><CreditCard className="h-6 w-6 text-blue-600" /></div>
                                                <div className="flex-grow"><p className="text-lg font-bold">{t.intlCard}</p><p className="text-xs text-muted-foreground">{t.intlDesc}</p></div>
                                                {field.value === 'credit_card' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                                            </Label>
                                            <Label htmlFor="mb" className={cn("flex items-center gap-4 rounded-2xl border-2 p-5 cursor-pointer transition-all", field.value === 'mobile_banking' ? "border-primary bg-primary/[0.03] shadow-md" : "border-border/50 hover:bg-muted/30")}>
                                                <RadioGroupItem value="mobile_banking" id="mb" className="sr-only" />
                                                <div className="bg-primary/10 p-3 rounded-xl"><Wallet className="h-6 w-6 text-primary" /></div>
                                                <div className="flex-grow"><p className="text-lg font-bold">{t.other}</p><p className="text-xs text-muted-foreground">{t.otherDesc}</p></div>
                                                {field.value === 'mobile_banking' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                                            </Label>
                                        </RadioGroup>
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        
                        {paymentMethod === 'mobile_banking' && (
                             <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-4 duration-500">
                                <div className="text-sm text-muted-foreground bg-muted/50 p-6 rounded-[2rem] border-2 border-dashed">
                                    <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> {t.guideTitle}</h3>
                                    <ol className="space-y-3 leading-relaxed font-medium">
                                        <li>১. {t.step1}</li>
                                        <li>২. {t.step2}</li>
                                        <li>৩. {t.step3.replace('{num}', merchantNumber)}</li>
                                        <li>৪. {t.step4.replace('{price}', priceText)}</li>
                                        <li>৫. {t.step5}</li>
                                    </ol>
                                </div>
                                <FormField control={form.control} name="transactionId" render={({ field }) => (
                                    <FormItem><FormLabel className="font-bold uppercase text-[10px] tracking-widest">{t.trxLabel}</FormLabel><FormControl><Input placeholder="e.g. 8N7F6G5H4J" {...field} className="h-14 rounded-xl border-2" /></FormControl><FormMessage /></FormItem>
                                )} />
                             </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button type="button" variant="outline" onClick={onBack} disabled={isNavigating} className="h-14 rounded-2xl flex-1 font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> {t.back}</Button>
                            <Button type="submit" className="h-14 rounded-2xl flex-1 font-bold shadow-xl shadow-primary/20" disabled={isNavigating}>
                                {isNavigating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.processing}</> : t.next}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}