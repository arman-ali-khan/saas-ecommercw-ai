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
import { Loader2 } from 'lucide-react';
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
    // This runs on the client, so window is available.
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

  // This effect handles redirection if a user is already logged in
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

    toast({ title: 'Login Successful!' });
    
    // Redirect logic is now handled directly here
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

  // Show a loader if auth state is loading or a user is logged in (and we're about to redirect).
  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">আবারও স্বাগতম!</CardTitle>
          <CardDescription>
            আপনার অ্যাকাউন্টে চালিয়ে যেতে সাইন ইন করুন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইমেল</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
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
                    <FormLabel>পাসওয়ার্ড</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'সাইন ইন করা হচ্ছে...' : 'সাইন ইন'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            অ্যাকাউন্ট নেই?{' '}
            <Link
              href="/get-started"
              className="font-medium text-primary hover:underline"
            >
              সাইন আপ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
