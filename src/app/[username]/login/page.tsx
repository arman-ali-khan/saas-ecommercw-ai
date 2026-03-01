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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Mail, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
  password: z.string().min(1, { message: 'পাসওয়ার্ড প্রয়োজন।' }),
});

export default function CustomerLoginPage() {
  const { customerLogin, customer, _hasHydrated } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Identify, 2: OTP, 3: New Password
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetType, setResetType] = useState<'email' | 'phone'>('email');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [isForgotDialogOpen, setIsForgotDialogOpen] = useState(false);

  useEffect(() => {
    const getSiteId = async () => {
        if (username) {
            const { data } = await supabase.from('profiles').select('id').eq('domain', username).single();
            if (data) {
                setSiteId(data.id);
            }
        }
    }
    getSiteId();
  }, [username]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (_hasHydrated && customer) {
      router.replace(`/profile`);
    }
  }, [customer, _hasHydrated, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!siteId) {
        toast({ variant: 'destructive', title: 'Error', description: 'Store not found.' });
        return;
    }
    setIsSubmitting(true);
    const { error } = await customerLogin(values.email, values.password, siteId);
    
    if (error) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: error.message,
      });
    } else {
       toast({
        title: 'লগইন সফল!',
        description: 'আপনাকে আপনার প্রোফাইলে নিয়ে যাওয়া হচ্ছে...',
      });
      router.push('/profile');
    }
  }

  // --- Forgot Password Flow Functions ---

  const handleSendOTP = async () => {
    if (!resetIdentifier || !siteId) return;
    setIsResetLoading(true);
    try {
        const response = await fetch('/api/auth/otp/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                identifier: resetIdentifier, 
                type: resetType, 
                siteId,
                purpose: 'password_reset'
            }),
        });
        const result = await response.json();
        if (response.ok) {
            toast({ title: 'ওটিপি পাঠানো হয়েছে!', description: 'আপনার ফোন বা ইমেল চেক করুন।' });
            setForgotPasswordStep(2);
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message });
    } finally {
        setIsResetLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!resetOtp || !siteId) return;
    setIsResetLoading(true);
    try {
        const response = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                identifier: resetIdentifier, 
                otp: resetOtp, 
                siteId 
            }),
        });
        const result = await response.json();
        if (response.ok) {
            setForgotPasswordStep(3);
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'ভুল ওটিপি', description: e.message });
    } finally {
        setIsResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !siteId) return;
    setIsResetLoading(true);
    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                identifier: resetIdentifier, 
                newPassword, 
                otp: resetOtp, 
                siteId 
            }),
        });
        const result = await response.json();
        if (response.ok) {
            toast({ title: 'পাসওয়ার্ড পরিবর্তিত হয়েছে!', description: 'এখন আপনি নতুন পাসওয়ার্ড দিয়ে লগইন করতে পারেন।' });
            setIsForgotDialogOpen(false);
            setForgotPasswordStep(1);
            setResetIdentifier('');
            setResetOtp('');
            setNewPassword('');
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message });
    } finally {
        setIsResetLoading(false);
    }
  };

  if (!_hasHydrated || customer) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <Card className="w-full max-w-md border-2 shadow-xl rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center bg-muted/30 pb-8 pt-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black font-headline">আবারও স্বাগতম!</CardTitle>
          <CardDescription>আপনার একাউন্টে প্রবেশ করতে ইমেল ও পাসওয়ার্ড দিন।</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">ইমেল</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} className="h-12 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                        <FormLabel className="font-bold">পাসওয়ার্ড</FormLabel>
                        <Dialog open={isForgotDialogOpen} onOpenChange={setIsForgotDialogOpen}>
                            <DialogTrigger asChild>
                                <button type="button" className="text-xs text-primary font-bold hover:underline">পাসওয়ার্ড ভুলে গেছেন?</button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2rem] sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                                        <KeyRound className="h-6 w-6 text-primary" /> পাসওয়ার্ড রিসেট
                                    </DialogTitle>
                                    <DialogDescription>
                                        আপনার ইমেল বা ফোন নম্বর দিয়ে একাউন্ট ভেরিফাই করুন।
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Step 1: Identification */}
                                {forgotPasswordStep === 1 && (
                                    <div className="space-y-6 py-4">
                                        <Tabs value={resetType} onValueChange={(v: any) => setResetType(v)}>
                                            <TabsList className="grid w-full grid-cols-2 rounded-xl h-11">
                                                <TabsTrigger value="email" className="rounded-lg gap-2"><Mail className="h-4 w-4" /> ইমেল</TabsTrigger>
                                                <TabsTrigger value="phone" className="rounded-lg gap-2"><Phone className="h-4 w-4" /> ফোন</TabsTrigger>
                                            </TabsList>
                                            <div className="mt-6 space-y-4">
                                                <Label className="font-bold">{resetType === 'email' ? 'আপনার ইমেল দিন' : 'আপনার ফোন নম্বর দিন'}</Label>
                                                <div className="relative">
                                                    {resetType === 'email' ? (
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    )}
                                                    <Input 
                                                        placeholder={resetType === 'email' ? 'example@mail.com' : '017XXXXXXXX'} 
                                                        className="pl-10 h-12 rounded-xl"
                                                        value={resetIdentifier}
                                                        onChange={(e) => setResetIdentifier(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </Tabs>
                                        <Button className="w-full h-12 rounded-xl font-bold" onClick={handleSendOTP} disabled={isResetLoading || !resetIdentifier}>
                                            {isResetLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <><ArrowRight className="mr-2 h-4 w-4" /> ওটিপি পাঠান</>}
                                        </Button>
                                    </div>
                                )}

                                {/* Step 2: OTP Verification */}
                                {forgotPasswordStep === 2 && (
                                    <div className="space-y-6 py-4">
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                                            <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
                                            <p className="text-xs text-muted-foreground">আমরা <strong>{resetIdentifier}</strong> ঠিকানায় একটি ওটিপি কোড পাঠিয়েছি। সেটি নিচে প্রদান করুন।</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold">৬-ডিজিটের ওটিপি (OTP)</Label>
                                            <Input 
                                                placeholder="XXXXXX" 
                                                className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl"
                                                maxLength={6}
                                                value={resetOtp}
                                                onChange={(e) => setResetOtp(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" className="flex-1 rounded-xl h-12" onClick={() => setForgotPasswordStep(1)}>পিছনে</Button>
                                            <Button className="flex-[2] rounded-xl h-12 font-bold" onClick={handleVerifyOTP} disabled={isResetLoading || resetOtp.length < 6}>
                                                {isResetLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'কোড ভেরিফাই করুন'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3: New Password */}
                                {forgotPasswordStep === 3 && (
                                    <div className="space-y-6 py-4">
                                        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex items-center gap-3">
                                            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">ভেরিফিকেশন সফল! এখন একটি নতুন পাসওয়ার্ড সেট করুন।</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold">নতুন পাসওয়ার্ড</Label>
                                            <Input 
                                                type="password"
                                                placeholder="••••••••" 
                                                className="h-12 rounded-xl"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleResetPassword} disabled={isResetLoading || newPassword.length < 6}>
                                            {isResetLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'পাসওয়ার্ড পরিবর্তন করুন'}
                                        </Button>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95"
                disabled={isSubmitting || !siteId}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'সাইন ইন করা হচ্ছে...' : 'লগ ইন করুন'}
              </Button>
            </form>
          </Form>
          <div className="mt-8 text-center text-sm border-t pt-6">
            <p className="text-muted-foreground">অ্যাকাউন্ট নেই?</p>
            <Link
              href={`/register`}
              className="font-bold text-primary hover:underline mt-1 inline-block"
            >
              নতুন অ্যাকাউন্ট তৈরি করুন
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <label className={cn("text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
        {children}
    </label>
);
