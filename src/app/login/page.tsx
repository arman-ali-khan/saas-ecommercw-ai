
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
    setHostname(window.location.host);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // This effect handles redirection after login
  useEffect(() => {
    // Wait until loading is false and user is populated
    if (!loading && user) {
      if (user.isSaaSAdmin) {
        toast({ title: 'Admin login successful' });
        // Use full page reload to prevent race condition with layout auth check
        window.location.href = '/dashboard';
      } else if (user.domain) {
        toast({
          title: 'লগইন সফল',
          description: `আবারও স্বাগতম, ${user.email}!`,
        });
        // Redirect to the user's subdomain
        if (hostname) {
          const rootDomain = hostname.split('.').slice(-2).join('.');
          window.location.href = `${window.location.protocol}//${user.domain}.${rootDomain}/admin`;
        }
      }
    }
  }, [user, loading, router, toast, hostname]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { error } = await saasLogin(values.email, values.password);
    setIsLoading(false);

    // On success, the useEffect above will handle the redirect.
    // We only need to handle the error case here.
    if (error) {
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: error || 'অবৈধ ইমেল বা পাসওয়ার্ড।',
      });
    }
  }

  // Show a loader if the auth state is loading, or if a user is already
  // logged in (and we're waiting for the redirect effect to fire).
  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
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
