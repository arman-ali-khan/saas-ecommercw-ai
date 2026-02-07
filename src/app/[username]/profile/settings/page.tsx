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
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  fullName: z.string().min(2, { message: 'পুরো নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  username: z.string().min(2, { message: 'ব্যবহারকারীর নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }).regex(/^[a-zA-Z0-9]+$/, 'ব্যবহারকারীর নাম শুধুমাত্র অক্ষর এবং সংখ্যা থাকতে পারে।'),
  email: z.string().email({ message: 'অবৈধ ইমেল ঠিকানা।' }),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1, { message: 'বর্তমান পাসওয়ার্ড প্রয়োজন।' }),
    newPassword: z.string().min(6, { message: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }),
    confirmPassword: z.string().min(6, { message: 'অনুগ্রহ করে আপনার নতুন পাসওয়ার্ড নিশ্চিত করুন।' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "পাসওয়ার্ড দুটি মিলছে না।",
    path: ["confirmPassword"],
});

type UsernameStatus = 'IDLE' | 'CHECKING' | 'AVAILABLE' | 'TAKEN' | 'INVALID';

export default function SettingsPage() {
    const { toast } = useToast();
    const { user, updateUser, checkUsername } = useAuth();
    const router = useRouter();
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('IDLE');
    
    const profileForm = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: { fullName: user?.fullName || '', username: user?.name || '', email: user?.email || '' },
    });

    const watchedUsername = profileForm.watch('username');

    const checkUsernameAvailability = useCallback(
        async (name: string) => {
            if (!user || name === user.name) {
                setUsernameStatus('IDLE');
                return;
            }
            setUsernameStatus('CHECKING');
            const status = await checkUsername(name, user.id);
            setUsernameStatus(status);
        },
        [user, checkUsername]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
          if (watchedUsername) {
            checkUsernameAvailability(watchedUsername);
          }
        }, 500); // Debounce time
    
        return () => clearTimeout(timer);
    }, [watchedUsername, checkUsernameAvailability]);


    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    });

    function onProfileSubmit(values: z.infer<typeof profileSchema>) {
        if (!user) return;
        if (usernameStatus === 'TAKEN' || usernameStatus === 'INVALID') {
            toast({
                variant: 'destructive',
                title: 'পরিবর্তনগুলি সংরক্ষণ করা যায়নি',
                description: 'দয়া করে ব্যবহারকারীর নামের সমস্যাটি সমাধান করুন।',
            });
            return;
        }

        const updatedUser = updateUser(user.id, { name: values.username, fullName: values.fullName });

        if (updatedUser) {
            toast({ title: 'প্রোফাইল আপডেট হয়েছে!' });
            // If username changed, redirect to the new page
            if (updatedUser.name !== user.name) {
                router.push(`/${updatedUser.name}/profile/settings`);
            }
        }
    }

    function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        console.log(values);
        toast({ title: 'পাসওয়ার্ড পরিবর্তন হয়েছে!' });
        passwordForm.reset();
    }

    const UsernameStatusIndicator = () => {
        if (usernameStatus === 'IDLE') return null;
        
        const messages: Record<UsernameStatus, {text: string; icon: React.ReactNode; className: string;}> = {
            IDLE: { text: '', icon: null, className: '' },
            CHECKING: { text: 'যাচাই করা হচ্ছে...', icon: <Loader2 className="animate-spin" />, className: 'text-muted-foreground' },
            AVAILABLE: { text: 'ব্যবহারকারীর নামটি উপলব্ধ', icon: <CheckCircle2 />, className: 'text-green-500' },
            TAKEN: { text: 'এই ব্যবহারকারীর নামটি ইতিমধ্যে ব্যবহৃত হচ্ছে', icon: <XCircle />, className: 'text-destructive' },
            INVALID: { text: 'শুধুমাত্র অক্ষর এবং সংখ্যা অনুমোদিত', icon: <XCircle />, className: 'text-destructive' },
        };
        const currentStatus = messages[usernameStatus];
        
        return (
            <div className={cn('flex items-center gap-2 text-sm', currentStatus.className)}>
                {currentStatus.icon}
                <span>{currentStatus.text}</span>
            </div>
        )
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
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ব্যবহারকারীর নাম</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                        <UsernameStatusIndicator />
                    </FormDescription>
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
                    <FormDescription>ইমেল পরিবর্তন করা যাবে না।</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={usernameStatus === 'CHECKING'}>পরিবর্তনগুলি সংরক্ষণ করুন</Button>
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
