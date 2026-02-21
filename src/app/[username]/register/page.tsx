
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
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
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
  const { registerCustomer } = useCustomerAuth();
  const [siteId, setSiteId] = useState<string | null>(null);

  useEffect(() => {
    const checkSiteAndLimit = async () => {
        if (!username) return;
        setIsCheckingLimit(true);
        
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, subscription_plan')
                .eq('domain', username)
                .single();

            if (profile) {
                setSiteId(profile.id);
                
                // Fetch Plan Limit and Current Count
                const [planRes, countRes] = await Promise.all([
                    supabase.from('plans').select('customer_limit').eq('id', profile.subscription_plan).single(),
                    supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('site_id', profile.id)
                ]);

                const limit = planRes.data?.customer_limit;
                const count = countRes.count || 0;

                if (limit !== null && limit !== undefined && count >= limit) {
                    setIsLimitReached(true);
                }
            }
        } catch (err) {
            console.error("Limit check error:", err);
        } finally {
            setIsCheckingLimit(false);
        }
    }
    checkSiteAndLimit();
  }, [username]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!siteId) {
        toast({ variant: 'destructive', title: 'ত্রুটি', description: 'সাইট খুঁজে পাওয়া যায়নি।' });
        return;
    }
    if (isLimitReached) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: 'দুঃখিত, এই স্টোরে বর্তমানে নতুন অ্যাকাউন্ট খোলা বন্ধ আছে।' });
        return;
    }

    setIsLoading(true);
    const result = await registerCustomer(
      values.fullName,
      values.email,
      values.password,
      siteId
    );
    setIsLoading(false);

    if (result.user) {
      toast({ title: 'নিবন্ধন সফল হয়েছে!', description: 'দয়া করে এখন লগ ইন করুন।' });
      router.push(`/login`);
    } else {
      toast({
        variant: 'destructive',
        title: 'নিবন্ধন ব্যর্থ',
        description: result.error || "An unknown error occurred.",
      });
    }
  }

  if (isCheckingLimit) {
      return (
          <div className="flex items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">অ্যাকাউন্ট তৈরি করুন</CardTitle>
          <CardDescription>
            কেনাকাটা চালিয়ে যেতে একটি গ্রাহক অ্যাকাউন্ট তৈরি করুন।
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLimitReached && (
              <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Registration Suspended</AlertTitle>
                  <AlertDescription>
                      দুঃখিত, এই স্টোরটিতে মেম্বার লিমিট পূর্ণ হয়ে যাওয়ায় বর্তমানে নতুন নিবন্ধন বন্ধ রয়েছে।
                  </AlertDescription>
              </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পুরো নাম</FormLabel>
                    <FormControl>
                      <Input placeholder="আপনার পুরো নাম" {...field} disabled={isLimitReached} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইমেল</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} disabled={isLimitReached} />
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLimitReached} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !form.formState.isValid || !siteId || isLimitReached}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'অ্যাকাউন্ট তৈরি করা হচ্ছে...' : 'অ্যাকাউন্ট তৈরি করুন'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
            <Link href={`/login`} className="font-medium text-primary hover:underline">
              সাইন ইন
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
