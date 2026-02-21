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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const formSchema = z.object({
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
  password: z.string().min(1, { message: 'পাসওয়ার্ড প্রয়োজন।' }),
});

export default function CustomerLoginPage() {
  const { customerLogin, customer, _hasHydrated } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);

  useEffect(() => {
    const getSiteId = async () => {
        if (username) {
            const { data } = await supabase.from('profiles').select('id').eq('domain', username).single();
            if (data) {
                setSiteId(data.id);
            } else {
                toast({ variant: 'destructive', title: 'Error', description: 'Store not found.' });
            }
        }
    }
    getSiteId();
  }, [username, toast]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Redirect if already logged in, after hydration
  useEffect(() => {
    if (_hasHydrated && customer) {
      router.replace(`/profile`);
    }
  }, [customer, _hasHydrated, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!siteId) {
        toast({ variant: 'destructive', title: 'Login Failed', description: 'Could not identify the store.' });
        return;
    }
    setIsSubmitting(true);
    const { error } = await customerLogin(values.email, values.password, siteId);
    
    if (error) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: error.message,
      });
    } else {
       toast({
        title: 'লগইন সফল!',
        description: 'আপনাকে আপনার প্রোফাইলে নিয়ে যাওয়া হচ্ছে...',
      });
      router.push('/profile');
    }
  }

  // Show a loader while hydrating or if a customer is found (and we're about to redirect).
  if (!_hasHydrated || customer) {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">লগ ইন</CardTitle>
          <CardDescription>আপনার অ্যাকাউন্টে চালিয়ে যেতে সাইন ইন করুন।</CardDescription>
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
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting || !siteId}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'সাইন ইন করা হচ্ছে...' : 'সাইন ইন'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            অ্যাকাউন্ট নেই?{' '}
            <Link href={`/register`} className="font-medium text-primary hover:underline">
              সাইন আপ
            </Link>
          </div>
          <div className="mt-6 text-center text-sm border-t pt-4">
            এডমিন লগইন{' '}
            <Link href={`/admin/login`} className="font-medium text-primary hover:underline">
              Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
