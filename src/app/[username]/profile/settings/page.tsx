
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
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
});

const passwordSchema = z.object({
    newPassword: z.string().min(6, { message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
    confirmPassword: z.string().min(6, { message: 'অনুগ্রহ করে আপনার নতুন পাসওয়ার্ড নিশ্চিত করুন।' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "পাসওয়ার্ড দুটি মিলছে না।",
    path: ["confirmPassword"],
});

export default function SettingsPage() {
    const { toast } = useToast();
    const { customer, updateCustomerProfile, updateCustomerPassword } = useCustomerAuth();
    const [isProfileLoading, setProfileLoading] = useState(false);
    const [isPasswordLoading, setPasswordLoading] = useState(false);
    
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: { fullName: '' },
    });

    useEffect(() => {
        if(customer) {
            profileForm.reset({ fullName: customer.full_name });
        }
    }, [customer, profileForm]);

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { newPassword: '', confirmPassword: '' },
    });

    async function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        if (!customer) return;
        setProfileLoading(true);
        const { error } = await updateCustomerProfile({ full_name: values.fullName });
        setProfileLoading(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Update failed', description: error });
        } else {
            toast({ title: 'প্রোফাইল আপডেট হয়েছে!' });
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        setPasswordLoading(true);
        const { error } = await updateCustomerPassword(values.newPassword);
        setPasswordLoading(false);

        if (error) {
            toast({ variant: 'destructive', title: 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে', description: `Error: ${error}` });
        } else {
            toast({ title: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে!' });
            passwordForm.reset();
        }
    }

  return (
    <div>
        <div className="mb-6">
            <h1 className="text-2xl font-bold">সেটিংস</h1>
            <p className="text-muted-foreground">আপনার অ্যাকাউন্ট ও ব্যক্তিগত তথ্য ম্যানেজ করুন।</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">প্রোফাইল</TabsTrigger>
                <TabsTrigger value="security">নিরাপত্তা</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
                <Card>
                    <CardHeader>
                        <CardTitle>প্রোফাইল ইনফরমেশন</CardTitle>
                        <CardDescription>আপনার পাবলিক প্রোফাইলের তথ্য আপডেট করুন।</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
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
                            <Input value={customer?.email || ''} readOnly disabled />
                            </FormControl>
                            <FormDescription>ইমেল পরিবর্তন করা যাবে না।</FormDescription>
                        </FormItem>
                        <Button type="submit" disabled={isProfileLoading}>
                            {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isProfileLoading ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="security">
                <Card>
                    <CardHeader>
                    <CardTitle>পাসওয়ার্ড পরিবর্তন করুন</CardTitle>
                    <CardDescription>নিরাপত্তার জন্য নিয়মিত আপনার পাসওয়ার্ড পরিবর্তন করুন।</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
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
                        <Button type="submit" disabled={isPasswordLoading}>
                            {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            পাসওয়ার্ড আপডেট করুন
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
