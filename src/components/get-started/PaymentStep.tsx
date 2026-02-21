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
import { Loader2, ArrowLeft } from "lucide-react";

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
            paymentMethod: formData.paymentMethod || 'mobile_banking',
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


    function onSubmit(values: z.infer<typeof paymentSchema>) {
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
        <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CardTitle>আপনার পেমেন্ট সম্পূর্ণ করুন</CardTitle>
                <CardDescription>
                    আপনি <span className="font-bold">{plan.name}</span> প্ল্যানটি বেছে নিয়েছেন। চালিয়ে যেতে অনুগ্রহ করে পেমেন্ট সম্পূর্ণ করুন।
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>পেমেন্ট পদ্ধতি বেছে নিন</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                        >
                                            <Label htmlFor="credit_card" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed">
                                                <RadioGroupItem value="credit_card" id="credit_card" className="sr-only" disabled />
                                                <p className="text-lg font-medium">ক্রেডিট কার্ড</p>
                                                <p className="text-xs text-muted-foreground">(শীঘ্রই আসছে)</p>
                                            </Label>
                                            <Label htmlFor="mobile_banking" className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                <RadioGroupItem value="mobile_banking" id="mobile_banking" className="sr-only" />
                                                <p className="text-lg font-medium">মোবাইল ব্যাংকিং</p>
                                            </Label>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        {paymentMethod === 'mobile_banking' && (
                             <div className="space-y-4 pt-4 border-t">
                                <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                                    <h3 className="font-bold mb-2 text-foreground">মোবাইল ব্যাংকিং নির্দেশনা</h3>
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>আপনার পছন্দের মোবাইল ব্যাংকিং অ্যাপ ({acceptedMethods}) খুলুন।</li>
                                        <li>"পেমেন্ট" অপশন নির্বাচন করুন।</li>
                                        <li>মার্চেন্ট নম্বর হিসেবে <strong>{merchantNumber}</strong> দিন।</li>
                                        <li>টাকার পরিমাণ হিসেবে <strong>৳{priceText}</strong> লিখুন।</li>
                                        <li>পেমেন্ট সম্পন্ন করুন এবং প্রাপ্ত ট্রানজেকশন আইডিটি কপি করুন।</li>
                                        <li>নিচের বক্সে ট্রানজেকশন আইডিটি পেস্ট করুন।</li>
                                    </ol>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="transactionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ট্রানজেকশন আইডি</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., 8N7F6G5H4J" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                             </div>
                        )}

                        <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={onBack} disabled={isNavigating} className="flex-1">
                                <ArrowLeft className="mr-2 h-4 w-4" /> আগের ধাপ
                            </Button>
                            <Button type="submit" className="flex-1" disabled={!form.formState.isValid || isNavigating}>
                                {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                পরবর্তী ধাপ
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}