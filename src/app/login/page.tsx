
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, KeyRound, Mail, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const formSchema = z.object({
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
  password: z.string().min(1, { message: 'পাসওয়ার্ড প্রয়োজন।' }),
});

export default function LoginPage() {
  const { saasLogin, user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostname(window.location.host);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!loading && user) {
        if (user.isSaaSAdmin) {
            window.location.href = '/dashboard';
        } else if (user.domain && hostname) {
            const rootDomain = hostname.split('.').slice(-2).join('.');
            window.location.href = `${window.location.protocol}//${user.domain}.${rootDomain}/admin`;
        }
    }
  }, [user, loading, hostname]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { user, error } = await saasLogin(values.email, values.password);

    if (error || !user) {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: error || 'অবৈধ ইমেল বা পাসওয়ার্ড।',
      });
      return;
    }

    toast({ title: 'লগইন সফল!' });
    
    const role = user.user_metadata?.role;
    if (role === 'saas_admin') {
      window.location.href = '/dashboard';
    } else if (role === 'admin') {
      const { data: profileData } = await supabase.from('profiles').select('domain').eq('id', user.id).single();
      if (profileData?.domain && hostname) {
        const rootDomain = hostname.split('.').slice(-2).join('.');
        window.location.href = `${window.location.protocol}//${profileData.domain}.${rootDomain}/admin`;
      } else {
        setIsLoading(false);
        toast({ variant: 'destructive', title: 'Redirect Failed', description: 'Could not determine your store domain.' });
      }
    } else {
      setIsLoading(false);
      toast({ variant: 'destructive', title: 'Login Failed', description: 'Invalid user role for this login page.' });
    }
  }

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full -z-10" />
      <Card className="w-full max-w-md border-2 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center bg-muted/30 pt-10 pb-8 border-b">
          <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black font-headline tracking-tight">আবারও স্বাগতম!</CardTitle>
          <CardDescription className="text-base mt-2">
            আপনার অ্যাকাউন্টে প্রবেশ করতে তথ্য দিন।
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">ইমেল অ্যাড্রেস</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="name@example.com" {...field} className="pl-10 h-12 rounded-xl" />
                      </div>
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
                    <FormLabel className="font-bold">পাসওয়ার্ড</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="h-12 rounded-xl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-4 pt-2">
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'লগ ইন করুন'}
                </Button>
                <Button variant="ghost" asChild className="w-full h-12 rounded-xl text-muted-foreground">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> হোমপেজে ফিরে যান
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
          <div className="mt-8 text-center text-sm border-t pt-6">
            অ্যাকাউন্ট নেই?{' '}
            <Link
              href="/get-started"
              className="font-bold text-primary hover:underline underline-offset-4"
            >
              নতুন স্টোর তৈরি করুন
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
