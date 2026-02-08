'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

const formSchema = z.object({
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
  password: z.string().min(1, { message: 'পাসওয়ার্ড প্রয়োজন।' }),
});

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const user = login(values.email, values.password);

    if (user) {
      if (user.isSaaSAdmin) {
        toast({ title: 'Admin login successful' });
        router.push('/dashboard');
      } else {
        toast({
          title: 'লগইন সফল',
          description: `আবারও স্বাগতম, ${user.fullName}!`,
        });
        router.push(`/${user.domain}/profile`);
      }
    } else {
      toast({
        variant: 'destructive',
        title: 'লগইন ব্যর্থ',
        description: 'অবৈধ ইমেল বা পাসওয়ার্ড।',
      });
    }
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
              <Button type="submit" className="w-full">
                সাইন ইন
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm">
            অ্যাকাউন্ট নেই?{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              সাইন আপ
            </Link>
          </div>
          <div className="mt-4 border-t pt-4 text-center text-xs">
            <p className="text-muted-foreground">
              প্ল্যাটফর্ম অ্যাডমিনিস্ট্রেটর?{' '}
              <button
                type="button"
                onClick={() => {
                  form.setValue('email', 'admin@banglanaturals.com');
                  form.setValue('password', 'admin');
                }}
                className="font-medium text-primary hover:underline"
              >
                অ্যাডমিন হিসাবে লগইন করুন
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
