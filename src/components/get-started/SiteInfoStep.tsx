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
    lang: 'en' | 'bn';
}

const translations = {
    bn: {
        title: "দোকানের বিবরণ দিন",
        desc: "আপনার নতুন ই-কমার্স স্টোর সম্পর্কে কিছু তথ্য দিন।",
        nameLabel: "দোকানের নাম",
        namePlaceholder: "যেমন: আমার প্রাকৃতিক দোকান",
        descLabel: "দোকানের সংক্ষিপ্ত বিবরণ",
        descPlaceholder: "আপনার স্টোর সম্পর্কে ২-৩ লাইন লিখুন...",
        back: "পিছে ফিরে যান",
        next: "সেটআপ সম্পন্ন করুন",
        processing: "সাবমিট হচ্ছে..."
    },
    en: {
        title: "Store Details",
        desc: "Tell us a bit about your new e-commerce store.",
        nameLabel: "Store Name",
        namePlaceholder: "e.g., My Organic Store",
        descLabel: "Short Description",
        descPlaceholder: "Write 2-3 lines about your store...",
        back: "Go Back",
        next: "Complete Setup",
        processing: "Submitting..."
    }
};

export default function SiteInfoStep({ formData, updateFormData, onNext, onBack, lang }: SiteInfoStepProps) {
    const [siteName, setSiteName] = useState(formData.siteName);
    const [siteDescription, setSiteDescription] = useState(formData.siteDescription);
    const [isNavigating, setIsNavigating] = useState(false);
    const t = translations[lang];

    const handleNext = () => {
        setIsNavigating(true);
        updateFormData({ siteName, siteDescription });
        onNext();
    }

    return (
        <Card className="max-w-lg mx-auto border-2 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-500">
            <CardHeader className="text-center bg-muted/30 p-8 pb-10 border-b">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"><Store className="h-7 w-7 text-primary" /></div>
                <CardTitle className="text-2xl font-black font-headline">{t.title}</CardTitle>
                <CardDescription className="text-base mt-2">{t.desc}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Label htmlFor="siteName" className="font-bold flex items-center gap-2 text-primary uppercase text-[10px] tracking-widest ml-1"><PenTool className="w-3 h-3" /> {t.nameLabel}</Label>
                        <Input id="siteName" placeholder={t.namePlaceholder} value={siteName} onChange={(e) => setSiteName(e.target.value)} className="h-14 rounded-2xl border-2 text-lg font-bold" />
                    </div>
                    <div className="space-y-3">
                        <Label htmlFor="siteDescription" className="font-bold flex items-center gap-2 text-primary uppercase text-[10px] tracking-widest ml-1"><Layout className="w-3 h-3" /> {t.descLabel}</Label>
                        <Textarea id="siteDescription" placeholder={t.descPlaceholder} value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className="rounded-2xl border-2 min-h-[120px] py-4" />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button variant="outline" onClick={onBack} disabled={isNavigating} className="h-14 rounded-2xl flex-1 font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> {t.back}</Button>
                    <Button onClick={handleNext} className="h-14 rounded-2xl flex-1 font-bold shadow-xl" disabled={!siteName || !siteDescription || isNavigating}>
                        {isNavigating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.processing}</> : t.next}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}