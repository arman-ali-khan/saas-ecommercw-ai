'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormData } from "@/app/get-started/page";

interface PaymentStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
}

export default function PaymentStep({ onNext }: PaymentStepProps) {
    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>পেমেন্টের বিবরণ</CardTitle>
                <CardDescription>আপনার পেমেন্ট তথ্য নিরাপদে লিখুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="cardNumber">কার্ড নম্বর</Label>
                    <Input id="cardNumber" placeholder="•••• •••• •••• ••••" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="expiryDate">মেয়াদ উত্তীর্ণের তারিখ</Label>
                        <Input id="expiryDate" placeholder="MM / YY" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="cvc">CVC</Label>
                        <Input id="cvc" placeholder="•••" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="cardHolder">কার্ড হোল্ডারের নাম</Label>
                    <Input id="cardHolder" placeholder="আপনার নাম" />
                </div>
                <Button onClick={onNext} className="w-full">
                    পেমেন্ট সম্পূর্ণ করুন
                </Button>
            </CardContent>
        </Card>
    );
}
