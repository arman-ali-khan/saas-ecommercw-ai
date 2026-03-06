
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormData } from "@/components/get-started/GetStartedFlow";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface DomainStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
    onBack: () => void;
    lang: 'en' | 'bn';
}

const translations = {
    bn: {
        title: "আপনার ডোমেইন বেছে নিন",
        desc: "আপনার দোকানের জন্য একটি অনন্য ইউআরএল (URL) তৈরি করুন।",
        checking: "চেক করা হচ্ছে...",
        unavailable: "এই ডোমেইনটি ইতিমধ্যে ব্যবহৃত হয়েছে।",
        reserved: "এই ডোমেইনটি সংরক্ষিত। অন্য একটি বেছে নিন।",
        available: "এই ডোমেইনটি উপলব্ধ!",
        tooShort: "ডোমেইন কমপক্ষে ৩ অক্ষরের হতে হবে।",
        back: "পিছে ফিরে যান",
        next: "পরবর্তী ধাপ",
        processing: "প্রসেসিং..."
    },
    en: {
        title: "Choose Your Domain",
        desc: "Create a unique URL for your online store.",
        checking: "Checking availability...",
        unavailable: "This domain is already taken.",
        reserved: "This domain is reserved. Please choose another.",
        available: "This domain is available!",
        tooShort: "Domain must be at least 3 characters.",
        back: "Go Back",
        next: "Next Step",
        processing: "Processing..."
    }
};

const RESERVED_DOMAINS = ['admin', 'dashboard', 'profile', 'api', 'www', 'store', 'shop'];

export default function DomainStep({ formData, updateFormData, onNext, onBack, lang }: DomainStepProps) {
    const [domain, setDomain] = useState(formData.domain);
    const [status, setStatus] = useState<'checking' | 'available' | 'unavailable' | 'empty' | 'too_short' | 'reserved'>('empty');
    const [debounced, setDebounced] = useState(domain);
    const [isNavigating, setIsNavigating] = useState(false);
    const baseDomain = 'e-bd.shop'; // Use the new domain for creation
    const t = translations[lang];

    useEffect(() => {
        const h = setTimeout(() => setDebounced(domain), 500);
        return () => clearTimeout(h);
    }, [domain]);

    useEffect(() => {
        const check = async () => {
            if (!debounced) { setStatus('empty'); return; }
            if (debounced.length < 3) { setStatus('too_short'); return; }
            if (RESERVED_DOMAINS.includes(debounced)) { setStatus('reserved'); return; }
            setStatus('checking');
            const { data } = await supabase.from('profiles').select('domain').eq('domain', debounced).maybeSingle();
            setStatus(data ? 'unavailable' : 'available');
        };
        check();
    }, [debounced]);

    const handleNext = () => {
        setIsNavigating(true);
        updateFormData({ domain });
        onNext();
    }
    
    return (
        <Card className="max-w-lg mx-auto border-2 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-500">
            <CardHeader className="text-center bg-muted/30 p-8 pb-10 border-b">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"><Globe className="h-7 w-7 text-primary" /></div>
                <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
                <CardDescription className="text-base mt-2">{t.desc}</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="relative group">
                        <Input
                            placeholder="your-store"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className={cn("h-16 text-2xl font-bold rounded-2xl border-2 pl-6 pr-32", status === 'available' ? "border-green-500" : (status === 'unavailable' || status === 'reserved' ? "border-destructive" : ""))}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-muted px-4 h-12 flex items-center rounded-xl font-bold shadow-inner">.{baseDomain}</div>
                    </div>
                    <div className="min-h-[40px]">
                        {status === 'checking' && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.checking}</p>}
                        {status === 'unavailable' && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> {t.unavailable}</p>}
                        {status === 'reserved' && <p className="text-sm text-destructive flex items-center"><AlertCircle className="mr-2 h-4 w-4" /> {t.reserved}</p>}
                        {status === 'available' && <p className="text-sm text-green-500 flex items-center"><CheckCircle2 className="mr-2 h-4 w-4" /> {t.available}</p>}
                        {status === 'too_short' && <p className="text-sm text-amber-500">{t.tooShort}</p>}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" onClick={onBack} disabled={isNavigating} className="h-14 rounded-2xl flex-1 font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> {t.back}</Button>
                    <Button onClick={handleNext} className="h-14 rounded-2xl flex-1 font-bold shadow-xl" disabled={status !== 'available' || isNavigating}>
                        {isNavigating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.processing}</> : t.next}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
