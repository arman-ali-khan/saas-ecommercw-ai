'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { useEffect, useState } from 'react';

const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'বর্তমান পাসওয়ার্ড প্রয়োজন।' }),
    newPassword: z.string().min(6, { message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
    confirmPassword: z.string().min(6, { message: 'অনুগ্রহ করে আপনার নতুন পাসওয়ার্ড নিশ্চিত করুন।' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "পাসওয়ার্ড দুটি মিলছে না।",
    path: ["confirmPassword"],
});

export default function SettingsPage() {
    const { toast } = useToast();
    const { user, updateUserProfile } = useAuth();
    const [isProfileLoading, setProfileLoading] = useState(false);
    
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: { fullName: '' },
    });

    useEffect(() => {
        if(user) {
            profileForm.reset({ fullName: user.fullName });
        }
    }, [user, profileForm]);

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        if (!user) return;
        setProfileLoading(true);
        const { error } = await updateUserProfile(user.id, { fullName: values.fullName });
        setProfileLoading(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Update failed', description: error });
        } else {
            toast({ title: 'প্রোফাইল আপডেট হয়েছে!' });
        }
    }

    function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        console.log(values);
        // In a real app, you would call supabase.auth.updateUser({ password: values.newPassword })
        // and handle current password verification on the server.
        toast({ title: 'পাসওয়ার্ড পরিবর্তন হয়েছে! (সিমুলেটেড)' });
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
                name="fullName"
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
               <FormItem>
                <FormLabel>ইমেল</FormLabel>
                <FormControl>
                  <Input value={user?.email || ''} readOnly disabled />
                </FormControl>
                <FormDescription>ইমেল পরিবর্তন করা যাবে না।</FormDescription>
              </FormItem>
              <Button type="submit" disabled={isProfileLoading}>
                {isProfileLoading ? 'সংরক্ষণ করা হচ্ছে...' : 'পরিবর্তনগুলি সংরক্ষণ করুন'}
              </Button>
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
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>নতুন পাসওয়ার্ড নিশ্চিত করুন</FormLabel>
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
