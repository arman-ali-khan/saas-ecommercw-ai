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
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export default function AdminLoginPage() {
  const { user: loggedInUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });
  
  // If user is already logged in as the correct admin, redirect them away from login.
  useEffect(() => {
    if (!authLoading && loggedInUser?.domain === username) {
      router.replace(`/${username}/admin`);
    }
  }, [authLoading, loggedInUser, username, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const { data: loginData, error } = await supabase.auth.signInWithPassword(values);

    if (error || !loginData.user) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.message || 'Invalid email or password.',
      });
      setIsSubmitting(false);
      return;
    }

    // After a successful login, fetch the user's profile to check their domain.
    const { data: profile } = await supabase
      .from('profiles')
      .select('domain, fullName')
      .eq('id', loginData.user.id)
      .single();

    if (profile && profile.domain) {
      // User is an admin for a site. Check if it's the correct one.
      if (profile.domain === username) {
        // Correct domain. The onAuthStateChange listener will handle setting global state.
        toast({
          title: 'Login Successful!',
          description: `Welcome back, ${profile.fullName}.`,
        });
        router.push(`/${username}/admin`);
      } else {
        // Wrong domain. Redirect them to their correct admin panel.
        toast({
          title: 'Redirecting...',
          description: `You are an admin for '${profile.domain}', not '${username}'. Redirecting you now.`,
          duration: 5000,
        });
        router.push(`/${profile.domain}/admin`);
      }
    } else {
      // This user has an auth account but no associated profile, so they aren't an admin.
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: "You are not authorized to access any admin panel.",
      });
      await logout(); // Log out the user who just logged in incorrectly.
      setIsSubmitting(false);
    }
  }

  // Show a full-screen loader while we are verifying if a user is already logged in.
  if (authLoading) {
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
            <Link href={`/${username}`} className="font-medium text-primary hover:underline">
              ← Back to Store
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
