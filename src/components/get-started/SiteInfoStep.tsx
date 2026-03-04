
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormData } from "@/components/get-started/GetStartedFlow";
import { useState } from "react";
import { Loader2, ArrowLeft, Layout, Store, PenTool } from 'lucide-react';

interface SiteInfoStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function SiteInfoStep({ formData, updateFormData, onNext, onBack }: SiteInfoStepProps) {
    const [siteName, setSiteName] = useState(formData.siteName);
    const [siteDescription, setSiteDescription] = useState(formData.siteDescription);
    const [isNavigating, setIsNavigating] = useState(false);

    const handleNext = () => {
        setIsNavigating(true);
        updateFormData({ siteName, siteDescription });
        onNext();
    }

    return (
        <Card className="max-w-lg mx-auto border-2 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-500">
            <CardHeader className="text-center bg-muted/30 p-8 pb-10 border-b">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Store className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black font-headline">দোকানের বিবরণ দিন</CardTitle>
                <CardDescription className="text-base mt-2">আপনার নতুন ই-কমার্স স্টোর সম্পর্কে কিছু তথ্য দিন।</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="siteName" className="font-bold flex items-center gap-2 text-primary uppercase text-[10px] tracking-widest ml-1"><PenTool className="w-3 h-3" /> দোকানের নাম</Label>
                        <Input
                            id="siteName"
                            placeholder="যেমন: আমার প্রাকৃতিক দোকান"
                            value={siteName}
                            onChange={(e) => setSiteName(e.target.value)}
                            className="h-14 rounded-2xl border-2 focus:border-primary text-lg font-bold"
                        />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="siteDescription" className="font-bold flex items-center gap-2 text-primary uppercase text-[10px] tracking-widest ml-1"><Layout className="w-3 h-3" /> দোকানের সংক্ষিপ্ত বিবরণ</Label>
                        <Textarea
                            id="siteDescription"
                            placeholder="আপনার স্টোর সম্পর্কে ২-৩ লাইন লিখুন..."
                            value={siteDescription}
                            onChange={(e) => setSiteDescription(e.target.value)}
                            className="rounded-2xl border-2 focus:border-primary min-h-[120px] py-4 text-base leading-relaxed"
                        />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button variant="outline" onClick={onBack} disabled={isNavigating} className="h-14 rounded-2xl flex-1 font-bold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> পিছে ফিরে যান
                    </Button>
                    <Button onClick={handleNext} className="h-14 rounded-2xl flex-1 font-bold shadow-xl shadow-primary/20" disabled={!siteName || !siteDescription || isNavigating}>
                        {isNavigating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> সাবমিট হচ্ছে...</> : 'সেটআপ সম্পন্ন করুন'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
