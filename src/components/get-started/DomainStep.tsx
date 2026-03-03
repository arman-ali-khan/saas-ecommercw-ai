
'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { FormData } from "@/components/get-started/GetStartedFlow";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, ArrowLeft } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

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
                    console.error("Error checking domain", error);
                    setAvailabilityStatus('unavailable');
                    return;
                }

                if (data) {
                    setAvailabilityStatus('unavailable');
                } else {
                    setAvailabilityStatus('available');
                }
            } catch (err) {
                 console.error("Error in checkDomainAvailability:", err);
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
                return <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> পরীক্ষা করা হচ্ছে...</p>;
            case 'unavailable':
                return <p className="text-sm text-destructive">এই ডোমেইনটি ইতিমধ্যে ব্যবহৃত হয়েছে।</p>;
            case 'reserved':
                return <p className="text-sm text-destructive">এই ডোমেইনটি সংরক্ষিত। অনুগ্রহ করে অন্য একটি বেছে নিন।</p>;
            case 'available':
                return <p className="text-sm text-green-500">এই ডোমেইনটি উপলব্ধ!</p>;
            case 'too_short':
                return <p className="text-sm text-destructive">ডোমেইন কমপক্ষে ৩ অক্ষরের হতে হবে।</p>
            case 'empty':
            default:
                return <div className="h-5" />;
        }
    }
    
    const isNextDisabled = availabilityStatus !== 'available';

    return (
        <Card className="max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CardTitle>আপনার ডোমেইন বেছে নিন</CardTitle>
                <CardDescription>আপনার দোকানের জন্য একটি অনন্য ঠিকানা তৈরি করুন।</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center">
                        <Input
                            id="domain"
                            placeholder="your-store"
                            value={domain}
                            onChange={handleDomainChange}
                            className="rounded-r-none focus:ring-0 focus:ring-offset-0"
                            autoComplete="off"
                        />
                        <span className="bg-muted px-4 h-10 flex items-center rounded-r-md border border-l-0 border-input text-muted-foreground">
                            {isLoadingDomain ? (
                                <Skeleton className="h-4 w-24" />
                            ) : (
                                `.${baseDomain}`
                            )}
                        </span>
                    </div>
                    <div className="min-h-[20px]">
                        <StatusMessage />
                    </div>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={onBack} disabled={isNavigating} className="flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" /> আগের ধাপ
                    </Button>
                    <Button onClick={handleNext} className="flex-1" disabled={isNextDisabled || isNavigating}>
                        {isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        পরবর্তী ধাপ
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
