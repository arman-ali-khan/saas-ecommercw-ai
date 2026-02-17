
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
import { useTranslation } from '@/hooks/use-translation';

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
    const t = useTranslation();
    const { profile: t_profile } = t;
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
            toast({ title: 'Profile updated!' });
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        setPasswordLoading(true);
        const { error } = await updateCustomerPassword(values.newPassword);
        setPasswordLoading(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Failed to change password', description: `Error: ${error}` });
        } else {
            toast({ title: 'Password changed successfully!' });
            passwordForm.reset();
        }
    }

  return (
    <div>
        <div className="mb-6">
            <h1 className="text-2xl font-bold">{t_profile.settings}</h1>
            <p className="text-muted-foreground">{t_profile.settingsDesc}</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
                <Card>
                    <CardHeader>
                        <CardTitle>{t_profile.profileInfo}</CardTitle>
                        <CardDescription>{t_profile.profileInfoDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t_profile.fullName}</FormLabel>
                                <FormControl>
                                <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>{t_profile.email}</FormLabel>
                            <FormControl>
                            <Input value={customer?.email || ''} readOnly disabled />
                            </FormControl>
                            <FormDescription>{t_profile.emailCannotChange}</FormDescription>
                        </FormItem>
                        <Button type="submit" disabled={isProfileLoading}>
                            {isProfileLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isProfileLoading ? t_profile.saving : t_profile.save}
                        </Button>
                        </form>
                    </Form>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="security">
                <Card>
                    <CardHeader>
                    <CardTitle>{t_profile.changePassword}</CardTitle>
                    <CardDescription>{t_profile.changePasswordDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t_profile.newPassword}</FormLabel>
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
                                <FormLabel>{t_profile.confirmNewPassword}</FormLabel>
                                <FormControl>
                                <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isPasswordLoading}>
                            {isPasswordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t_profile.updatePassword}
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
