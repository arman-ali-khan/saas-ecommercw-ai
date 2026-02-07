'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'বর্তমান পাসওয়ার্ড প্রয়োজন।' }),
    newPassword: z.string().min(6, { message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
});

export default function SettingsPage() {
    const { toast } = useToast();
    const { user } = useAuth();

    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: user?.name || '', email: user?.email || '' },
    });

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '' },
    });

    function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        console.log(values);
        toast({ title: 'প্রোফাইল আপডেট হয়েছে!' });
    }

    function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        console.log(values);
        toast({ title: 'পাসওয়ার্ড পরিবর্তন হয়েছে!' });
        passwordForm.reset();
    }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>অ্যাকাউন্ট সেটিংস</CardTitle>
          <CardDescription>আপনার ব্যক্তিগত বিবরণ আপডেট করুন।</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>পুরো নাম</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ইমেল</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">পরিবর্তনগুলি সংরক্ষণ করুন</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>পাসওয়ার্ড পরিবর্তন</CardTitle>
          <CardDescription>নিরাপত্তার জন্য নিয়মিত আপনার পাসওয়ার্ড পরিবর্তন করুন।</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>বর্তমান পাসওয়ার্ড</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>নতুন পাসওয়ার্ড</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">পাসওয়ার্ড আপডেট করুন</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
