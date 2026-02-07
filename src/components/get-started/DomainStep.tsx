'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormData } from "@/app/get-started/page";
import { useState } from "react";

interface DomainStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
}

export default function DomainStep({ formData, updateFormData, onNext }: DomainStepProps) {
    const [domain, setDomain] = useState(formData.domain);

    const handleNext = () => {
        updateFormData({ domain });
        onNext();
    }

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CardTitle>আপনার ডোমেইন বেছে নিন</CardTitle>
                <CardDescription>আপনার দোকানের জন্য একটি অনন্য ঠিকানা তৈরি করুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center">
                    <Input
                        id="domain"
                        placeholder="your-store"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className="rounded-r-none focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="bg-muted px-4 py-2 rounded-r-md border border-l-0 border-input text-muted-foreground">
                        .banglanaturals.site
                    </span>
                </div>
                <Button onClick={handleNext} className="w-full" disabled={!domain}>
                    পরবর্তী ধাপ
                </Button>
            </CardContent>
        </Card>
    );
}
