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
  const { customerLogin,customer:user } = useCustomerAuth();
  const router = useRouter();
  const params = useParams();
  const domain = params.username as string;
  const { toast } = useToast();
  
  console.log(user,'router')
  
  const [isLoading, setIsLoading] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);

  // Define the form correctly using useForm
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    async function fetchSiteId() {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('domain', domain)
        .single();
      
      if (data) setSiteId(data.id);
    }
    fetchSiteId();
  }, [domain]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'customer') {
        router.push(`/${domain}/profile`);
      } else if (user.domain === domain) {
        router.push(`/${domain}/admin`);
      }
    }
  }, [user, router, domain]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Note: You need a way to get siteId. 
    // Usually, you fetch it based on the 'username' from the URL.
    setIsLoading(true);
    const result = await customerLogin(values.email, values.password, siteId || '');
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: result.error,
      });
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">লগ ইন</CardTitle>
          <Link href={`/${domain}/admin/login`} className="font-medium text-primary hover:underline">
              Admin
            </Link>
          <CardDescription>আপনার অ্যাকাউন্টে চালিয়ে যেতে সাইন ইন করুন।</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form component receives the 'form' variable defined above */}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'সাইন ইন করা হচ্ছে...' : 'সাইন ইন'}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            অ্যাকাউন্ট নেই?{' '}
            <Link href={`/${domain}/register`} className="font-medium text-primary hover:underline">
              সাইন আপ
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}