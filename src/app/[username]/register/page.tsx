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
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

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
  const { registerCustomer } = useAuth();
  const [siteId, setSiteId] = useState<string | null>(null);

  useEffect(() => {
    const getSiteId = async () => {
        if (username) {
            const { data } = await supabase
            .from('profiles')
            .select('id')
            .eq('domain', username)
            .single();
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
      fullName: '',
      email: '',
      password: '',
    },
    mode: 'onChange',
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!siteId) {
        toast({
            variant: 'destructive',
            title: 'ত্রুটি',
            description: 'সাইট খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
        });
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
      toast({
        title: 'নিবন্ধন প্রায় সম্পন্ন!',
        description:
          'আপনার নিবন্ধন নিশ্চিত করতে দয়া করে আপনার ইমেল পরীক্ষা করুন।',
        duration: 10000,
      });
      router.push(`/${username}/login`);
    } else {
      toast({
        variant: 'destructive',
        title: 'নিবন্ধন ব্যর্থ',
        description: result.error,
      });
    }
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !form.formState.isValid || !siteId}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading
                  ? 'অ্যাকাউন্ট তৈরি করা হচ্ছে...'
                  : 'অ্যাকাউন্ট তৈরি করুন'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
            <Link
              href={`/${username}/login`}
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
