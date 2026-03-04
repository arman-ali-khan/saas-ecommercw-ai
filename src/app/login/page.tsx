'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const translations = {
  bn: {
    title: "আবারও স্বাগতম!",
    desc: "আপনার অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন।",
    email: "ইমেল অ্যাড্রেস",
    password: "পাসওয়ার্ড",
    loginBtn: "লগ ইন করুন",
    backBtn: "হোমপেজে ফিরে যান",
    noAccount: "অ্যাকাউন্ট নেই?",
    registerLink: "নতুন স্টোর তৈরি করুন",
    errorEmail: "অবৈধ ইমেল ঠিকানা।",
    errorPass: "পাসওয়ার্ড প্রয়োজন।",
    success: "লগইন সফল!",
    failed: "লগইন ব্যর্থ"
  },
  en: {
    title: "Welcome Back!",
    desc: "Enter your credentials to access your account.",
    email: "Email Address",
    password: "Password",
    loginBtn: "Login Now",
    backBtn: "Back to Home",
    noAccount: "Don't have an account?",
    registerLink: "Create New Store",
    errorEmail: "Invalid email address.",
    errorPass: "Password is required.",
    success: "Login Successful!",
    failed: "Login Failed"
  }
};

export default function LoginPage() {
  const { saasLogin, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  useEffect(() => {
    const country = sessionStorage.getItem('visitor_country');
    if (country && country !== 'BD') setLang('en');
  }, []);

  const t = translations[lang];

  const formSchema = z.object({
    email: z.string().email({ message: t.errorEmail }),
    password: z.string().min(1, { message: t.errorPass }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!loading && user) {
        if (user.isSaaSAdmin) router.push('/dashboard');
        else if (user.domain) router.push(`/${user.domain}/admin`);
    }
  }, [user, loading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { user: loggedIn, error } = await saasLogin(values.email, values.password);
    setIsLoading(false);

    if (error || !loggedIn) {
      toast({ variant: 'destructive', title: t.failed, description: error || 'Invalid email or password.' });
      return;
    }
    toast({ title: t.success });
  }

  if (loading || user) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center bg-muted/30 pt-10 pb-8 border-b">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4"><KeyRound className="h-7 w-7 text-primary" /></div>
          <CardTitle className="text-3xl font-black font-headline tracking-tight">{t.title}</CardTitle>
          <CardDescription className="mt-2">{t.desc}</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">{t.email}</FormLabel>
                    <FormControl><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="name@example.com" {...field} className="pl-10 h-12 rounded-xl" /></div></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">{t.password}</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} className="h-12 rounded-xl" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : t.loginBtn}
              </Button>
              <Button variant="ghost" asChild className="w-full h-12 rounded-xl"><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> {t.backBtn}</Link></Button>
            </form>
          </Form>
          <div className="mt-8 text-center text-sm border-t pt-6">{t.noAccount} <Link href="/get-started" className="font-bold text-primary hover:underline">{t.registerLink}</Link></div>
        </CardContent>
      </Card>
    </div>
  );
}