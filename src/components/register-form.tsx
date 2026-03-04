
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { supabase } from '@/lib/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  username: z
    .string()
    .min(3, { message: 'ব্যবহারকারীর নাম কমপক্ষে ৩ অক্ষরের হতে হবে।' })
    .regex(
      /^[a-zA-Z0-9]+$/,
      'ব্যবহারকারীর নাম শুধুমাত্র অক্ষর এবং সংখ্যা থাকতে পারে।'
    ),
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
  password: z.string().min(6, { message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
});

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteName = searchParams.get('siteName') || '';
  const domain = searchParams.get('domain') || '';
  const plan = searchParams.get('plan') || 'free';
  const siteDescription = searchParams.get('siteDescription') || '';
  const paymentMethod = searchParams.get('paymentMethod');
  const transactionId = searchParams.get('transactionId');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<
    'checking' | 'available' | 'unavailable' | 'empty' | 'invalid'
  >('empty');
  const [debouncedUsername, setDebouncedUsername] = useState('');

  const { register } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  const usernameValue = form.watch('username');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUsername(usernameValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [usernameValue]);

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      const username = debouncedUsername;

      if (!username) {
        setUsernameStatus('empty');
        return;
      }

      const usernameValidation = formSchema.shape.username.safeParse(username);
      if (!usernameValidation.success) {
        setUsernameStatus('invalid');
        return;
      }

      setUsernameStatus('checking');

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('username', username)
          .single();

        if (error && error.code !== 'PGRST116') {
          setUsernameStatus('unavailable');
        } else if (data) {
          setUsernameStatus('unavailable');
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        setUsernameStatus('unavailable');
      }
    };

    checkUsernameAvailability();
  }, [debouncedUsername]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!domain || !siteName) {
      toast({
        variant: 'destructive',
        title: 'নিবন্ধন ব্যর্থ',
        description:
          'ডোমেইন এবং সাইটের নাম প্রয়োজন। অনুগ্রহ করে আবার শুরু করুন।',
      });
      router.push('/get-started');
      return;
    }

    setIsLoading(true);
    const result = await register(
      values.username,
      values.fullName,
      values.email,
      values.password,
      domain,
      siteName,
      plan,
      siteDescription,
      paymentMethod,
      transactionId
    );
    setIsLoading(false);

    if (result.user) {
      toast({
        title: 'নিবন্ধন প্রায় সম্পন্ন!',
        description:
          'আপনার নিবন্ধন নিশ্চিত করতে দয়া করে আপনার ইমেল পরীক্ষা করুন।',
        duration: 10000,
      });
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
      const rootDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'dokanbd.shop';
      window.location.href = `${protocol}//${domain}.${rootDomain}/admin/login`;
    } else {
      toast({
        variant: 'destructive',
        title: 'নিবন্ধন ব্যর্থ',
        description: result.error,
      });
    }
  }

  const isSubmitDisabled =
    isLoading || !form.formState.isValid || usernameStatus !== 'available';

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {siteName
              ? `"${siteName}" এর জন্য অ্যাকাউন্ট তৈরি করুন`
              : 'অ্যাকাউন্ট তৈরি করুন'}
          </CardTitle>
          <CardDescription>
            {siteName
              ? 'আপনার নতুন দোকান পরিচালনা করতে একটি অ্যাডমিন অ্যাকাউন্ট তৈরি করুন।'
              : 'আমাদের সাথে আপনার যাত্রা শুরু করতে দোকানবিডি-এ যোগ দিন।'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পুরো নাম</FormLabel>
                    <FormControl>
                      <Input placeholder="আপনার পুরো নাম" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ব্যবহারকারীর নাম</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="আপনার ব্যবহারকারীর নাম (কোনো স্পেস নেই)"
                        {...field}
                        autoComplete="off"
                      />
                    </FormControl>
                    {usernameStatus === 'checking' && (
                      <p className="text-sm text-muted-foreground flex items-center pt-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> পরীক্ষা
                        করা হচ্ছে...
                      </p>
                    )}
                    {usernameStatus === 'unavailable' && (
                      <p className="text-sm text-destructive pt-2">
                        এই ব্যবহারকারীর নামটি ইতিমধ্যে ব্যবহৃত হয়েছে।
                      </p>
                    )}
                     {usernameStatus === 'invalid' && (
                      <p className="text-sm text-destructive pt-2">
                        ব্যবহারকারীর নাম শুধুমাত্র অক্ষর এবং সংখ্যা থাকতে পারে।
                      </p>
                    )}
                    {usernameStatus === 'available' && (
                      <p className="text-sm text-green-500 pt-2">
                        এই ব্যবহারকারীর নামটি উপলব্ধ!
                      </p>
                    )}
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
              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitDisabled}
                >
                  {isLoading
                    ? 'অ্যাকাউন্ট তৈরি করা হচ্ছে...'
                    : 'অ্যাকাউন্ট তৈরি করুন'}
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> হোমপেজে ফিরে যান
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              সাইন ইন
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
