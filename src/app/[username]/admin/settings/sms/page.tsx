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
import { useEffect, useState, useCallback } from 'react';
import { Loader2, MessageSquare, Save, AlertCircle, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const smsSettingsSchema = z.object({
  sms_notifications_enabled: z.boolean().default(false),
  admin_sms_number: z.string().min(11, 'সঠিক ফোন নম্বর দিন (যেমন: 017XXXXXXXX)').max(14).optional().or(z.literal('')),
});

type SmsSettingsFormData = z.infer<typeof smsSettingsSchema>;

export default function SmsSettingsPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFreeUser = user?.subscriptionPlan === 'free';

  const form = useForm<SmsSettingsFormData>({
    resolver: zodResolver(smsSettingsSchema),
    defaultValues: { sms_notifications_enabled: false, admin_sms_number: '' },
  });

  const fetchSettings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const response = await fetch('/api/settings/sms/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();
        
        if (response.ok) {
            form.reset({ 
                sms_notifications_enabled: result.sms_notifications_enabled ?? false, 
                admin_sms_number: result.admin_sms_number || '' 
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error loading settings', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, form, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchSettings();
    } else if (!authLoading && !user) {
        setIsLoading(false);
    }
  }, [user, authLoading, fetchSettings]);

  async function onSubmit(values: SmsSettingsFormData) {
    if (!user) return;
    if (isFreeUser) {
        toast({ variant: 'destructive', title: 'অ্যাক্সেস রিফিউজড', description: 'SMS সার্ভিসটি শুধুমাত্র পেইড ইউজারদের জন্য।' });
        return;
    }
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/settings/sms/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                siteId: user.id, 
                sms_notifications_enabled: values.sms_notifications_enabled,
                admin_sms_number: values.admin_sms_number
            }),
        });

        const result = await response.json();

        if (response.ok) {
            toast({ title: 'SMS settings saved!' });
        } else {
            throw new Error(result.error || 'Failed to save settings');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isLoading || authLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96 mt-2" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-14 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">SMS Settings</h1>
      
      {isFreeUser ? (
        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400">
            <Crown className="h-4 w-4" />
            <AlertTitle className="font-bold">Premium Feature</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
                <p>দুঃখিত, SMS নোটিফিকেশন সার্ভিসটি শুধুমাত্র আমাদের <strong>প্রো (Pro)</strong> এবং <strong>এন্টারপ্রাইজ (Enterprise)</strong> ইউজারদের জন্য।</p>
                <Button asChild size="sm" variant="outline" className="border-amber-500/50 hover:bg-amber-500/20">
                    <Link href="/admin/settings">এখনই আপগ্রেড করুন</Link>
                </Button>
            </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertTitle>গুরুত্বপূর্ণ তথ্য</AlertTitle>
            <AlertDescription>
            অর্ডার আসার সাথে সাথে আপনার মোবাইলে SMS পেতে এই সার্ভিসটি চালু করুন। সার্ভিসটি ব্যবহারের জন্য আপনার ব্যালেন্সে পর্যাপ্ত ক্রেডিট থাকতে হবে (যদি প্রযোজ্য হয়)।
            </AlertDescription>
        </Alert>
      )}

      <Card className={cn("border-2 shadow-sm", isFreeUser && "opacity-60 grayscale-[0.5]")}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> SMS কনফিগারেশন</CardTitle>
          <CardDescription>
            অর্ডার নোটিফিকেশন পাওয়ার জন্য আপনার ফোন নম্বর সেট করুন।
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <fieldset disabled={isFreeUser} className="space-y-8">
                <FormField
                    control={form.control}
                    name="sms_notifications_enabled"
                    render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 p-4 bg-muted/10">
                        <div className="space-y-0.5">
                        <FormLabel className="text-base font-bold">SMS নোটিফিকেশন সক্রিয় করুন</FormLabel>
                        <FormDescription>
                            নতুন অর্ডার আসলে আপনার মোবাইলে স্বয়ংক্রিয়ভাবে মেসেজ চলে যাবে।
                        </FormDescription>
                        </div>
                        <FormControl>
                        <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="admin_sms_number"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold">অ্যাডমিন ফোন নম্বর</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g. 017XXXXXXXX" className="h-12 text-lg font-medium" {...field} />
                        </FormControl>
                        <FormDescription>
                        এই নম্বরে সকল অর্ডারের তথ্য পাঠানো হবে।
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <div className="pt-4">
                    <Button type="submit" size="lg" disabled={isSubmitting || isFreeUser} className="min-w-[200px] h-12 rounded-xl shadow-lg shadow-primary/20">
                    {isSubmitting ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> সেভ হচ্ছে...</>
                    ) : (
                        <><Save className="mr-2 h-4 w-4" /> সেটিংস সেভ করুন</>
                    )}
                    </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
