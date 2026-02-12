'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormData } from "@/app/get-started/page";
import { useState } from "react";
import { Loader2 } from 'lucide-react';

interface SiteInfoStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
}

export default function SiteInfoStep({ formData, updateFormData, onNext }: SiteInfoStepProps) {
    const [siteName, setSiteName] = useState(formData.siteName);
    const [siteDescription, setSiteDescription] = useState(formData.siteDescription);
    const [isNavigating, setIsNavigating] = useState(false);

    const handleNext = () => {
        setIsNavigating(true);
        updateFormData({ siteName, siteDescription });
        onNext();
    }

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CardTitle>আপনার সাইটের বিবরণ</CardTitle>
                <CardDescription>আপনার নতুন দোকান সম্পর্কে আমাদের কিছু তথ্য দিন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="siteName">দোকানের নাম</Label>
                    <Input
                        id="siteName"
                        placeholder="আমার প্রাকৃতিক দোকান"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="siteDescription">দোকানের সংক্ষিপ্ত বিবরণ</Label>
                    <Textarea
                        id="siteDescription"
                        placeholder="সেরা প্রাকৃতিক এবং অর্গানিক পণ্যের সম্ভার।"
                        value={siteDescription}
                        onChange={(e) => setSiteDescription(e.target.value)}
                    />
                </div>
                <Button onClick={handleNext} className="w-full" disabled={!siteName || !siteDescription || isNavigating}>
                    {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    সেটআপ সম্পূর্ণ করুন
                </Button>
            </CardContent>
        </Card>
    );
}
