'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { FormData } from "@/components/get-started/GetStartedFlow";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Plan } from "@/types";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Wallet, CheckCircle2, Info } from "lucide-react";
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
        title: "পেমেন্ট পদ্ধতি",
        desc: "আপনি {planName} প্ল্যানটি বেছে নিয়েছেন। সাবস্ক্রিপশন মূল্য: ৳{price}",
        other: "ম্যানুয়াল পেমেন্ট",
        otherDesc: "মোবাইল ব্যাংকিং (বিকাশ/নগদ/রকেট)",
        guideTitle: "পেমেন্ট নির্দেশনা",
        step1: "আপনার মোবাইল ব্যাংকিং অ্যাপটি খুলুন।",
        step2: "\"পেমেন্ট\" বা \"সেন্ড মানি\" অপশন নির্বাচন করুন।",
        step3: "নম্বর হিসেবে {num} দিন।",
        step4: "টাকার পরিমাণ হিসেবে ৳{price} লিখুন।",
        step5: "পেমেন্ট শেষে ট্রানজেকশন আইডি নিচের বক্সে দিন।",
        step6: "আপনার ট্রানজেকশন আইডি সঠিক হলে স্বয়ংক্রিয় ভাবে একাউন্ট এক্টিভ হবে।",
        trxLabel: "Transaction ID",
        back: "পিছে ফিরে যান",
        next: "পরবর্তী ধাপ",
        processing: "প্রসেসিং..."
    },
    en: {
        title: "Payment Method",
        desc: "You have selected the {planName} plan. Subscription Price: ৳{price}",
        other: "Manual Payment",
        otherDesc: "Mobile Banking (bKash/Nagad/Rocket)",
        guideTitle: "Payment Instructions",
        step1: "Open your mobile banking app.",
        step2: "Select \"Payment\" or \"Send Money\".",
        step3: "Enter this number: {num}",
        step4: "Enter amount: ৳{price}",
        step5: "After payment, enter the Transaction ID below.",
        step6: "Your account will be automatically activated if the Transaction ID is correct.",
        trxLabel: "Transaction ID",
        back: "Go Back",
        next: "Next Step",
        processing: "Processing..."
    }
};

const paymentSchema = z.object({
    paymentMethod: z.string().default('mobile_banking'),
    transactionId: z.string().min(1, "Transaction ID is required."),
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
            paymentMethod: 'mobile_banking',
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

    const priceText = plan?.price === 0 ? '0' : plan?.price.toFixed(2) || '0';
    const planName = lang === 'en' ? (plan as any)?.name_en || plan?.name : plan?.name;
    const merchantNumber = settings?.mobile_banking_number || '017XXXXXXXX';
    
    function onSubmit(values: z.infer<typeof paymentSchema>) {
        setIsNavigating(true);
        updateFormData({ paymentMethod: values.paymentMethod, transactionId: values.transactionId });
        onNext();
    }

    if (isLoading || !plan) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <Card className="max-w-lg mx-auto border-2 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-500">
            <CardHeader className="text-center bg-muted/30 p-8 pb-10 border-b">
                <CardTitle className="text-2xl font-black font-headline">{t.title}</CardTitle>
                <CardDescription className="text-base mt-2">
                    {t.desc.replace('{planName}', planName).replace('{price}', priceText)}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="flex items-center gap-4 rounded-2xl border-2 p-5 bg-primary/[0.03] border-primary shadow-sm">
                    <div className="bg-primary/10 p-3 rounded-xl"><Wallet className="h-6 w-6 text-primary" /></div>
                    <div className="flex-grow">
                        <p className="text-lg font-bold">{t.other}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black">{t.otherDesc}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                
                <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-4 duration-500">
                    <div className="text-sm text-muted-foreground bg-muted/50 p-6 rounded-[2rem] border-2 border-dashed">
                        <h3 className="font-bold mb-4 text-foreground flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> {t.guideTitle}</h3>
                        <ol className="space-y-3 leading-relaxed font-medium">
                            <li>১. {t.step1}</li>
                            <li>২. {t.step2}</li>
                            <li>৩. {t.step3.replace('{num}', merchantNumber)}</li>
                            <li>৪. {t.step4.replace('{price}', priceText)}</li>
                            <li>৫. {t.step5}</li>
                            <li className="text-primary font-bold">৬. {t.step6}</li>
                        </ol>
                    </div>
                    
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="transactionId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold uppercase text-[10px] tracking-widest ml-1">{t.trxLabel}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. 8N7F6G5H4J" {...field} className="h-14 rounded-xl border-2 font-mono text-lg font-bold" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button type="button" variant="outline" onClick={onBack} disabled={isNavigating} className="h-14 rounded-2xl flex-1 font-bold">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> {t.back}
                                </Button>
                                <Button type="submit" className="h-14 rounded-2xl flex-1 font-bold shadow-xl shadow-primary/20" disabled={isNavigating}>
                                    {isNavigating ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t.processing}</> : t.next}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </CardContent>
        </Card>
    );
}
