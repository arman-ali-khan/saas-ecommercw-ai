
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
} from '@/components/ui/dialog';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Mail, Phone, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

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

  // Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyPhone, setVerifyPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isResending, setIsResending] = useState(false);

  // Forgot Password States
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
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
            if (data) setSiteId(data.id);
        }
    }
    getSiteId();
  }, [username]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (_hasHydrated && customer) {
      router.replace(`/profile`);
    }
  }, [customer, _hasHydrated, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!siteId) return;
    setIsSubmitting(true);
    const { error }: any = await customerLogin(values.email, values.password, siteId);
    
    if (error) {
      setIsSubmitting(false);
      if (error.message === 'verification_pending' || (error.phone)) {
          setVerifyPhone(error.phone);
          setIsVerifying(true);
          toast({ title: 'ভেরিফিকেশন প্রয়োজন', description: 'আপনার ফোনে ওটিপি পাঠানো হয়েছে।' });
      } else {
          toast({ variant: 'destructive', title: 'লগইন ব্যর্থ', description: error.message || 'ভুল ইমেল বা পাসওয়ার্ড।' });
      }
    } else {
       toast({ title: 'লগইন সফল!', description: 'প্রোফাইলে নিয়ে যাওয়া হচ্ছে...' });
       router.push('/profile');
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || !siteId) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: verifyPhone, otp: otpCode, siteId }),
        });
        const result = await response.json();
        if (response.ok) {
            toast({ title: 'ভেরিফিকেশন সফল!', description: 'এখন আবার লগইন করুন।' });
            setIsVerifying(false);
            setOtpCode('');
        } else throw new Error(result.error);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'ভুল ওটিপি', description: e.message });
    } finally { setIsSubmitting(false); }
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
    } catch (e) { console.error(e); } finally { setIsResending(false); }
  };

  // --- Forgot Password Flow ---
  const handleSendResetOTP = async () => {
    if (!resetIdentifier || !siteId) return;
    setIsResetLoading(true);
    try {
        const response = await fetch('/api/auth/otp/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: resetIdentifier, type: resetType, siteId, purpose: 'password_reset' }),
        });
        if (response.ok) { setForgotPasswordStep(2); toast({ title: 'ওটিপি পাঠানো হয়েছে!' }); }
        else throw new Error((await response.json()).error);
    } catch (e: any) { toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message }); } finally { setIsResetLoading(false); }
  };

  const handleVerifyResetOTP = async () => {
    if (!resetOtp || !siteId) return;
    setIsResetLoading(true);
    try {
        const response = await fetch('/api/auth/otp/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: resetIdentifier, otp: resetOtp, siteId }),
        });
        if (response.ok) setForgotPasswordStep(3);
        else throw new Error((await response.json()).error);
    } catch (e: any) { toast({ variant: 'destructive', title: 'ভুল ওটিপি', description: e.message }); } finally { setIsResetLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !siteId) return;
    setIsResetLoading(true);
    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: resetIdentifier, newPassword, otp: resetOtp, siteId }),
        });
        if (response.ok) {
            toast({ title: 'পাসওয়ার্ড পরিবর্তিত হয়েছে!' });
            setIsForgotDialogOpen(false);
            setForgotPasswordStep(1);
        } else throw new Error((await response.json()).error);
    } catch (e: any) { toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message }); } finally { setIsResetLoading(false); }
  };

  if (!_hasHydrated || customer) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="flex items-center justify-center py-20 px-4">
      <Card className="w-full max-w-md border-2 shadow-xl rounded-[2rem] overflow-hidden">
        {!isVerifying ? (
            <>
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
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel className="font-bold">ইমেল</FormLabel><FormControl><Input placeholder="you@example.com" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center">
                                <FormLabel className="font-bold">পাসওয়ার্ড</FormLabel>
                                <Dialog open={isForgotDialogOpen} onOpenChange={setIsForgotDialogOpen}>
                                    <button type="button" onClick={() => setIsForgotDialogOpen(true)} className="text-xs text-primary font-bold hover:underline">পাসওয়ার্ড ভুলে গেছেন?</button>
                                    <DialogContent className="rounded-[2rem] sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black flex items-center gap-2"><KeyRound className="h-6 w-6 text-primary" /> পাসওয়ার্ড রিসেট</DialogTitle>
                                        </DialogHeader>
                                        {forgotPasswordStep === 1 && (
                                            <div className="space-y-6 py-4">
                                                <Tabs value={resetType} onValueChange={(v: any) => setResetType(v)}>
                                                    <TabsList className="grid w-full grid-cols-2 rounded-xl h-11">
                                                        <TabsTrigger value="email" className="rounded-lg gap-2">ইমেল</TabsTrigger>
                                                        <TabsTrigger value="phone" className="rounded-lg gap-2">ফোন</TabsTrigger>
                                                    </TabsList>
                                                    <div className="mt-6 space-y-4">
                                                        <Label className="font-bold">{resetType === 'email' ? 'আপনার ইমেল দিন' : 'আপনার ফোন নম্বর দিন'}</Label>
                                                        <Input 
                                                            placeholder={resetType === 'email' ? 'example@mail.com' : '017XXXXXXXX'} 
                                                            className="h-12 rounded-xl"
                                                            value={resetIdentifier}
                                                            onChange={(e) => setResetIdentifier(e.target.value)}
                                                        />
                                                    </div>
                                                </Tabs>
                                                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleSendResetOTP} disabled={isResetLoading || !resetIdentifier}>
                                                    {isResetLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'ওটিপি পাঠান'}
                                                </Button>
                                            </div>
                                        )}
                                        {forgotPasswordStep === 2 && (
                                            <div className="space-y-6 py-4">
                                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                                                    <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
                                                    <p className="text-xs text-muted-foreground">আমরা <strong>{resetIdentifier}</strong> ঠিকানায় কোড পাঠিয়েছি।</p>
                                                </div>
                                                <Input 
                                                    placeholder="XXXXXX" 
                                                    className="h-14 text-center text-2xl font-black tracking-[0.5em] rounded-xl"
                                                    maxLength={6}
                                                    value={resetOtp}
                                                    onChange={(e) => setResetOtp(e.target.value)}
                                                />
                                                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleVerifyResetOTP} disabled={isResetLoading || resetOtp.length < 6}>
                                                    {isResetLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'কোড ভেরিফাই করুন'}
                                                </Button>
                                            </div>
                                        )}
                                        {forgotPasswordStep === 3 && (
                                            <div className="space-y-6 py-4">
                                                <Label className="font-bold">নতুন পাসওয়ার্ড</Label>
                                                <Input type="password" placeholder="••••••••" className="h-12 rounded-xl" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                                <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20" onClick={handleResetPassword} disabled={isResetLoading || newPassword.length < 6}>
                                                    {isResetLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'পাসওয়ার্ড পরিবর্তন করুন'}
                                                </Button>
                                            </div>
                                        )}
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'লগ ইন করুন'}
                    </Button>
                    </form>
                </Form>
                <div className="mt-8 text-center text-sm border-t pt-6">
                    <p className="text-muted-foreground">অ্যাকাউন্ট নেই? <Link href={`/register`} className="font-bold text-primary hover:underline">নতুন অ্যাকাউন্ট তৈরি করুন</Link></p>
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
                        আপনার ফোন <strong>*******{verifyPhone.slice(-4)}</strong> এ ওটিপি পাঠানো হয়েছে।
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
                    <Button className="w-full h-12 rounded-xl font-bold" onClick={handleVerifyOTP} disabled={isSubmitting || otpCode.length < 6}>
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'কোড ভেরিফাই করুন'}
                    </Button>
                    <div className="text-center">
                        <Button variant="link" size="sm" onClick={handleResendOTP} disabled={isResending} className="text-primary font-bold">
                            {isResending ? 'পাঠানো হচ্ছে...' : 'ওটিপি পুনরায় পাঠান'}
                        </Button>
                    </div>
                    <Button variant="ghost" className="w-full" onClick={() => setIsVerifying(false)}>পিছনে ফিরে যান</Button>
                </CardContent>
            </>
        )}
      </Card>
    </div>
  );
}
