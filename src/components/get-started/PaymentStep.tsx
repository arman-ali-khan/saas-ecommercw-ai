'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { FormData } from "@/app/get-started/page";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface PaymentStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
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

const planPrices: { [key: string]: number | string } = {
    pro: 999,
    enterprise: 'Custom',
};


export default function PaymentStep({ formData, updateFormData, onNext }: PaymentStepProps) {
    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            paymentMethod: 'mobile_banking',
            transactionId: '',
        }
    });

    const paymentMethod = form.watch('paymentMethod');
    const price = formData.plan && planPrices[formData.plan] ? planPrices[formData.plan] : 0;

    function onSubmit(values: z.infer<typeof paymentSchema>) {
        console.log("Payment details submitted:", values);
        updateFormData({
            paymentMethod: values.paymentMethod,
            transactionId: values.transactionId,
        })
        onNext();
    }

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CardTitle>আপনার পেমেন্ট সম্পূর্ণ করুন</CardTitle>
                <CardDescription>
                    আপনি <span className="font-bold capitalize">{formData.plan}</span> প্ল্যানটি বেছে নিয়েছেন। চালিয়ে যেতে অনুগ্রহ করে পেমেন্ট সম্পূর্ণ করুন।
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
                                        <li>আপনার পছন্দের মোবাইল ব্যাংকিং অ্যাপ (বিকাশ, নগদ, ইত্যাদি) খুলুন।</li>
                                        <li>"পেমেন্ট" অপশন নির্বাচন করুন।</li>
                                        <li>মার্চেন্ট নম্বর হিসেবে <strong>01234567890</strong> দিন।</li>
                                        <li>টাকার পরিমাণ হিসেবে <strong>৳ {price}</strong> লিখুন।</li>
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

                        <Button type="submit" className="w-full" disabled={!form.formState.isValid}>
                            পেমেন্ট সম্পূর্ণ করুন
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
