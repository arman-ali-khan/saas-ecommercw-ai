'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useState } from 'react';

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

export default function CustomerLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const { user, error } = await login(values.email, values.password);
    setIsLoading(false);

    if (user) {
      toast({
        title: 'লগইন সফল',
        description: `আবারও স্বাগতম, ${user.fullName}!`,
      });
      // Customers and admins both go to the profile page on this domain
      router.push(`/${username}/profile`);
    } else {
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: error || 'অবৈধ ইমেল বা পাসওয়ার্ড।',
      });
    }
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">লগ ইন</CardTitle>
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
              href={`/${username}/register`}
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
