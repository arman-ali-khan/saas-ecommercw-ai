
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Phone, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

const phoneRegex = /^(?:\+88|88)?(01[3-9]\d{8})$/;

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
  phone: z.string().regex(phoneRegex, { message: 'সঠিক ফোন নম্বর দিন (017XXXXXXXX)।' }),
  password: z.string().min(6, { message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
});

export default function CustomerRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const { registerCustomer } = useCustomerAuth();

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const checkSiteAndLimit = async () => {
        if (!username) return;
        setIsCheckingLimit(true);
        try {
            const { data: profile } = await supabase.from('profiles').select('id, subscription_plan').eq('domain', username).single();
            if (profile) {
                setSiteId(profile.id);
                const [planRes, countRes] = await Promise.all([
                    supabase.from('plans').select('customer_limit').eq('id', profile.subscription_plan).single(),
                    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('site_id', profile.id)
                ]);
                const limit = planRes.data?.customer_limit;
                const count = countRes.count || 0;
                if (limit !== null && limit !== undefined && count >= limit) setIsLimitReached(true);
            }
        } catch (err) { console.error(err); } finally { setIsCheckingLimit(false); }
    }
    checkSiteAndLimit();
  }, [username]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '' },
    mode: 'onChange',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!siteId || isLimitReached) return;
    setIsLoading(true);
    const result = await registerCustomer(values.fullName, values.email, values.password, values.phone, siteId);
    setIsLoading(false);

    if (result.user) {
      toast({ title: 'অ্যাকাউন্ট তৈরি হয়েছে!', description: 'ফোন নম্বর ভেরিফাই করুন।' });
      setVerifyPhone(values.phone);
      setIsVerifying(true);
    } else {
      toast({ variant: 'destructive', title: 'নিবন্ধন ব্যর্থ', description: result.error || "An unknown error occurred." });
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 6 || !siteId) return;
    setIsLoading(true);
    try {
        const response = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: verifyPhone, otp: otpCode, siteId }),
        });
        const result = await response.json();
        if (response.ok) {
            toast({ title: 'ভেরিফিকেশন সফল!', description: 'এখন লগইন করুন।' });
            router.push('/login');
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'ভুল ওটিপি', description: e.message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!verifyPhone || !siteId) return;
    setIsResending(true);
    try {
        const response = await fetch('/api/auth/otp/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: verifyPhone, type: 'phone', siteId }),
        });
        if (response.ok) toast({ title: 'ওটিপি পুনরায় পাঠানো হয়েছে!' });
        else throw new Error('Resend failed');
    } catch (e) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'আবার চেষ্টা করুন।' });
    } finally {
        setIsResending(false);
    }
  };

  if (isCheckingLimit) {
      return <div className="flex items-center justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md border-2 shadow-xl rounded-[2rem] overflow-hidden">
        {!isVerifying ? (
            <>
                <CardHeader className="text-center bg-muted/30 pb-8 pt-8">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black font-headline">অ্যাকাউন্ট তৈরি করুন</CardTitle>
                <CardDescription className="px-6">কেনাকাটা চালিয়ে যেতে একটি গ্রাহক অ্যাকাউন্ট তৈরি করুন।</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                {isLimitReached && (
                    <Alert variant="destructive" className="mb-6 rounded-xl">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Registration Suspended</AlertTitle>
                        <AlertDescription>দুঃখিত, বর্তমানে নতুন নিবন্ধন বন্ধ রয়েছে।</AlertDescription>
                    </Alert>
                )}
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">পুরো নাম</FormLabel><FormControl><Input placeholder="আপনার নাম" {...field} disabled={isLimitReached} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">ফোন নম্বর</FormLabel><FormControl><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="017XXXXXXXX" {...field} disabled={isLimitReached} className="h-12 rounded-xl pl-10" /></div></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">ইমেল</FormLabel><FormControl><Input placeholder="example@mail.com" {...field} disabled={isLimitReached} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">পাসওয়ার্ড</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isLimitReached} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 mt-4" disabled={isLoading || isLimitReached}>
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'অ্যাকাউন্ট তৈরি করুন'}
                    </Button>
                    </form>
                </Form>
                <div className="mt-8 text-center text-sm border-t pt-6">
                    <p className="text-muted-foreground">ইতিমধ্যে একটি অ্যাকাউন্ট আছে? <Link href={`/login`} className="font-bold text-primary hover:underline">সাইন ইন করুন</Link></p>
                </div>
                </CardContent>
            </>
        ) : (
            <>
                <CardHeader className="text-center bg-muted/30 pb-8 pt-8">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-black font-headline">নম্বর ভেরিফাই করুন</CardTitle>
                    <CardDescription>
                        আমরা আপনার ফোন <strong>*******{verifyPhone.slice(-4)}</strong> এ একটি কোড পাঠিয়েছি।
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="font-bold">৬-ডিজিটের ওটিপি (OTP)</Label>
                        <Input 
                            placeholder="XXXXXX" 
                            className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                        />
                    </div>
                    <Button className="w-full h-12 rounded-xl font-bold" onClick={handleVerifyOTP} disabled={isLoading || otpCode.length < 6}>
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'কোড ভেরিফাই করুন'}
                    </Button>
                    <div className="text-center">
                        <Button variant="link" size="sm" onClick={handleResendOTP} disabled={isResending} className="text-primary font-bold">
                            {isResending ? 'পাঠানো হচ্ছে...' : 'ওটিপি পুনরায় পাঠান'}
                        </Button>
                    </div>
                </CardContent>
            </>
        )}
      </Card>
    </div>
  );
}
