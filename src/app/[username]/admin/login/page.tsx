
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
    if (typeof window !== 'undefined') {
      setHostname(window.location.hostname);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    if (!authLoading && loggedInUser?.domain === username) {
      // Correct admin for this store
      router.replace('/admin');
    } else if (!authLoading && loggedInUser && loggedInUser.domain !== username) {
      // Logged in as a different store's admin
      toast({
        title: 'Redirecting...',
        description: `You are an admin for '${loggedInUser.domain}'. Switching to your store.`,
      });
      
      if (hostname) {
        const isLocalhost = hostname.includes('localhost');
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'e-bd.shop';
        
        if (isLocalhost) {
            router.push(`/admin/login`); 
        } else {
            // Priority: use their custom domain if they have one, else subdomain
            const targetDomain = loggedInUser.custom_domain || `${loggedInUser.domain}.${baseDomain}`;
            window.location.href = `${window.location.protocol}//${targetDomain}/admin`;
        }
      }
    }
  }, [authLoading, loggedInUser, username, router, toast, hostname]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const { error } = await storeLogin(values.email, values.password, username);

    if (error) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error || 'Invalid email or password for this site.',
      });
      return;
    }
    
    toast({
      title: 'Login Successful!',
      description: 'Opening your dashboard...',
    });
    // Ensure full page reload to sync sessions and apply correct store domain context
    window.location.href = '/admin';
  }

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
