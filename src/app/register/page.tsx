'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';

const formSchema = z.object({
  fullName: z.string().min(2, { message: 'পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  name: z.string().min(2, { message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }).regex(/^[a-zA-Z0-9]+$/, 'ব্যবহারকারীর নাম শুধুমাত্র অক্ষর এবং সংখ্যা থাকতে পারে।'),
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
  password: z.string().min(6, { message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
});

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteName = searchParams.get('siteName');
  const domain = searchParams.get('domain');

  const { register } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      name: '',
      email: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const registeredUser = register(values.name, values.fullName, values.email, values.password);
    if (registeredUser) {
      // Logic for what to do with siteName and domain would go here.
      // For this prototype, we just redirect.
      // The auth context handles redirection now.
      // router.push(`/${registeredUser.name}/profile`);
    }
  }

  return (
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {siteName ? `"${siteName}" এর জন্য অ্যাকাউন্ট তৈরি করুন` : 'অ্যাকাউন্ট তৈরি করুন'}
            </CardTitle>
            <CardDescription>
              {siteName ? 'আপনার নতুন দোকান পরিচালনা করতে একটি অ্যাডমিন অ্যাকাউন্ট তৈরি করুন।' : 'আমাদের সাথে আপনার যাত্রা শুরু করতে বাংলা ন্যাচারালস-এ যোগ দিন।'}
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ব্যবহারকারীর নাম</FormLabel>
                      <FormControl>
                        <Input placeholder="আপনার ব্যবহারকারীর নাম (কোনো স্পেস নেই)" {...field} />
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
                <Button type="submit" className="w-full">
                  অ্যাকাউন্ট তৈরি করুন
                </Button>
              </form>
            </Form>
            <div className="mt-6 text-center text-sm">
              ইতিমধ্যে একটি অ্যাকাউন্ট আছে?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                সাইন ইন
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
