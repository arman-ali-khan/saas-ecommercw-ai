
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormData } from "@/components/get-started/GetStartedFlow";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DomainStepProps {
    formData: FormData;
    updateFormData: (data: Partial<FormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

const RESERVED_DOMAINS = ['admin', 'dashboard', 'profile', 'products', 'about', 'checkout', 'login', 'register', 'get-started', 'api', 'www', 'store', 'shop', 'mail', 'ftp', 'test', 'dev'];

export default function DomainStep({ formData, updateFormData, onNext, onBack }: DomainStepProps) {
    const [domain, setDomain] = useState(formData.domain);
    const [availabilityStatus, setAvailabilityStatus] = useState<'checking' | 'available' | 'unavailable' | 'empty' | 'too_short' | 'reserved'>('empty');
    const [debouncedDomain, setDebouncedDomain] = useState(domain);
    const [isNavigating, setIsNavigating] = useState(false);
    const [baseDomain, setBaseDomain] = useState('dokanbd.shop');
    const [isLoadingDomain, setIsLoadingDomain] = useState(true);

    useEffect(() => {
        const fetchBaseDomain = async () => {
            setIsLoadingDomain(true);
            const { data } = await supabase
                .from('saas_settings')
                .select('base_domain')
                .eq('id', 1)
                .single();
            if (data && data.base_domain) {
                setBaseDomain(data.base_domain);
            }
            setIsLoadingDomain(false);
        };
        fetchBaseDomain();
    }, []);

    useEffect(() => {
        if(formData.domain) {
            setDebouncedDomain(formData.domain);
        }
    }, [formData.domain]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedDomain(domain);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [domain]);

    useEffect(() => {
        const checkDomainAvailability = async () => {
            if (!debouncedDomain) {
                setAvailabilityStatus('empty');
                return;
            }
            if (debouncedDomain.length < 3) {
                setAvailabilityStatus('too_short');
                return;
            }
            if (RESERVED_DOMAINS.includes(debouncedDomain)) {
                setAvailabilityStatus('reserved');
                return;
            }

            setAvailabilityStatus('checking');

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('domain')
                    .eq('domain', debouncedDomain)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    setAvailabilityStatus('unavailable');
                    return;
                }

                if (data) {
                    setAvailabilityStatus('unavailable');
                } else {
                    setAvailabilityStatus('available');
                }
            } catch (err) {
                 setAvailabilityStatus('unavailable');
            }
        };

        checkDomainAvailability();
    }, [debouncedDomain]);


    const handleNext = () => {
        setIsNavigating(true);
        updateFormData({ domain });
        onNext();
    }
    
    const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setDomain(value);
    }
    
    const StatusMessage = () => {
        switch (availabilityStatus) {
            case 'checking':
                return <p className="text-sm text-muted-foreground flex items-center px-4 py-2 bg-muted/30 rounded-xl"><Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> চেক করা হচ্ছে...</p>;
            case 'unavailable':
                return <p className="text-sm text-destructive flex items-center px-4 py-2 bg-destructive/5 rounded-xl border border-destructive/10"><AlertCircle className="mr-2 h-4 w-4" /> এই ডোমেইনটি ইতিমধ্যে ব্যবহৃত হয়েছে।</p>;
            case 'reserved':
                return <p className="text-sm text-destructive flex items-center px-4 py-2 bg-destructive/5 rounded-xl border border-destructive/10"><AlertCircle className="mr-2 h-4 w-4" /> এই ডোমেইনটি সংরক্ষিত। অন্য একটি বেছে নিন।</p>;
            case 'available':
                return <p className="text-sm text-green-500 flex items-center px-4 py-2 bg-green-500/5 rounded-xl border border-green-500/10"><CheckCircle2 className="mr-2 h-4 w-4" /> এই ডোমেইনটি উপলব্ধ!</p>;
            case 'too_short':
                return <p className="text-sm text-amber-500 flex items-center px-4 py-2 bg-amber-500/5 rounded-xl border border-amber-500/10">ডোমেইন কমপক্ষে ৩ অক্ষরের হতে হবে।</p>
            case 'empty':
            default:
                return <div className="h-9" />;
        }
    }
    
    const isNextDisabled = availabilityStatus !== 'available';

    return (
        <Card className="max-w-lg mx-auto border-2 shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-500">
            <CardHeader className="text-center bg-muted/30 p-8 pb-10 border-b">
                <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Globe className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black font-headline">আপনার ডোমেইন বেছে নিন</CardTitle>
                <CardDescription className="text-base mt-2">আপনার দোকানের জন্য একটি অনন্য ইউআরএল (URL) তৈরি করুন।</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                    <div className="relative group">
                        <Input
                            id="domain"
                            placeholder="your-store"
                            value={domain}
                            onChange={handleDomainChange}
                            className={cn(
                                "h-16 text-2xl font-bold rounded-2xl border-2 pl-6 pr-32 transition-all",
                                availabilityStatus === 'available' ? "border-green-500 focus:ring-green-500/20" : 
                                availabilityStatus === 'unavailable' || availabilityStatus === 'reserved' ? "border-destructive focus:ring-destructive/20" : "focus:border-primary"
                            )}
                            autoComplete="off"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-muted px-4 h-12 flex items-center rounded-xl border-2 border-border/50 text-muted-foreground font-mono text-sm font-bold shadow-inner">
                            {isLoadingDomain ? <Loader2 className="h-4 w-4 animate-spin" /> : `.${baseDomain}`}
                        </div>
                    </div>
                    <div className="min-h-[40px]">
                        <StatusMessage />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" onClick={onBack} disabled={isNavigating} className="h-14 rounded-2xl flex-1 font-bold">
                        <ArrowLeft className="mr-2 h-4 w-4" /> পিছে ফিরে যান
                    </Button>
                    <Button onClick={handleNext} className="h-14 rounded-2xl flex-1 font-bold shadow-xl shadow-primary/20" disabled={isNextDisabled || isNavigating}>
                        {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        পরবর্তী ধাপ
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
