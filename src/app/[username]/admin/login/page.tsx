
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

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function AdminLoginPage() {
  const { user: loggedInUser, loading: authLoading, storeLogin } = useAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    // This runs on the client, so window is available.
    setHostname(window.location.hostname);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  // If user is already logged in as the correct admin, redirect them away from login.
  useEffect(() => {
    if (!authLoading && loggedInUser?.domain === username) {
      router.replace(`/admin`);
    } else if (!authLoading && loggedInUser && loggedInUser.domain !== username) {
      // If logged in as a *different* admin, redirect to their correct dashboard
      toast({
        title: 'Redirecting...',
        description: `You are logged in as an admin for '${loggedInUser.domain}'. Redirecting you now.`,
      });
      if (hostname) {
        const rootDomain = hostname.split('.').slice(-2).join('.');
        window.location.href = `${window.location.protocol}//${loggedInUser.domain}.${rootDomain}/admin`;
      }
    }
  }, [authLoading, loggedInUser, username, router, toast, hostname]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const { error } = await storeLogin(values.email, values.password, username);
    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error || 'Invalid email or password for this site.',
      });
      return;
    }

    // On success, don't do anything here. The AuthProvider's onAuthStateChange
    // will handle fetching the profile and setting the user state.
    // The useEffect hook will then handle the redirect.
    toast({
      title: 'Login Successful!',
      description: 'Redirecting to your dashboard...',
    });
  }

  // Show a full-screen loader while we are verifying if a user is already logged in or needs redirecting.
  if (authLoading || loggedInUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>Sign in to manage store: {username}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="admin@example.com" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            <Link href="/" className="font-medium text-primary hover:underline">
              ← Back to Store
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
