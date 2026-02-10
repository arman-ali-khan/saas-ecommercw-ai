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
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const availableBankingMethods = [
  { id: 'bkash', label: 'বিকাশ' },
  { id: 'nagad', label: 'নগদ' },
  { id: 'rocket', label: 'রকেট' },
  { id: 'upay', label: 'উপায়' },
];

const settingsSchema = z.object({
  siteName: z.string().min(2, { message: 'সাইটের নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  siteDescription: z.string().min(10, { message: 'সাইটের বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে।' }),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  mobileBankingEnabled: z.boolean().default(false),
  mobileBankingNumber: z.string().optional(),
  acceptedBankingMethods: z.array(z.string()).default([]),
});

export default function SettingsAdminPage() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      siteName: '',
      siteDescription: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      mobileBankingEnabled: false,
      mobileBankingNumber: '',
      acceptedBankingMethods: [],
    },
  });
  
  useEffect(() => {
    if (user) {
        setIsLoading(true);
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from('store_settings')
                .select('*')
                .eq('site_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
            }

            // Always reset with profile data, then override with store_settings if they exist.
            form.reset({
                siteName: user.siteName || '',
                siteDescription: user.siteDescription || '',
                seoTitle: data?.seo_title || '',
                seoDescription: data?.seo_description || '',
                seoKeywords: data?.seo_keywords || '',
                mobileBankingEnabled: data?.mobile_banking_enabled ?? false,
                mobileBankingNumber: data?.mobile_banking_number || '',
                acceptedBankingMethods: data?.accepted_banking_methods || [],
            });
            setIsLoading(false);
        }
        fetchSettings();
    }
  }, [user, form, toast]);

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    if (!user) return;
    setIsSubmitting(true);

    const { siteName, siteDescription, ...storeSettingsData } = values;

    // Update profiles table for site name and description
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            site_name: siteName,
            site_description: siteDescription,
        })
        .eq('id', user.id);
    
    if (profileError) {
        toast({ variant: 'destructive', title: 'Error updating site info', description: profileError.message });
        setIsSubmitting(false);
        return;
    }

    // Upsert store_settings table for other settings
    const { error: settingsError } = await supabase
        .from('store_settings')
        .upsert({
            site_id: user.id,
            seo_title: storeSettingsData.seoTitle,
            seo_description: storeSettingsData.seoDescription,
            seo_keywords: storeSettingsData.seoKeywords,
            mobile_banking_enabled: storeSettingsData.mobileBankingEnabled,
            mobile_banking_number: storeSettingsData.mobileBankingNumber,
            accepted_banking_methods: storeSettingsData.acceptedBankingMethods,
        });
        
    setIsSubmitting(false);

    if (settingsError) {
        toast({ variant: 'destructive', title: 'Error saving settings', description: settingsError.message });
    } else {
        toast({
            title: 'সেটিংস সংরক্ষিত হয়েছে!',
            description: 'আপনার সাইটের তথ্য সফলভাবে আপডেট করা হয়েছে।',
        });
        await refreshUser(); // Refresh user data in the auth store
    }
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>সাইট সেটিংস</CardTitle>
                <CardDescription>আপনার সাইটের সাধারণ তথ্য এবং এসইও (SEO) বিবরণ পরিচালনা করুন।</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>সাইট সেটিংস</CardTitle>
        <CardDescription>
          আপনার সাইটের সাধারণ তথ্য এবং এসইও (SEO) বিবরণ পরিচালনা করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">সাধারণ</TabsTrigger>
                <TabsTrigger value="seo">এসইও</TabsTrigger>
                <TabsTrigger value="payments">পেমেন্ট</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="mt-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>সাইটের নাম</FormLabel>
                        <FormControl>
                          <Input placeholder="বাংলা ন্যাচারালস" {...field} />
                        </FormControl>
                        <FormDescription>
                          এটি আপনার সাইটের শিরোনামে এবং অন্যান্য স্থানে প্রদর্শিত হবে।
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="siteDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>সাইটের বিবরণ</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="আপনার সাইট সম্পর্কে একটি সংক্ষিপ্ত বিবরণ লিখুন..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          আপনার সাইটের একটি সংক্ষিপ্ত সারসংক্ষেপ।
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              <TabsContent value="seo" className="mt-6">
                <div className="space-y-6">
                    <FormField
                        control={form.control}
                        name="seoTitle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>এসইও শিরোনাম</FormLabel>
                            <FormControl>
                                <Input placeholder="বাংলা ন্যাচারালস - খাঁটি বাংলাদেশী পণ্য" {...field} />
                            </FormControl>
                            <FormDescription>
                                সার্চ ইঞ্জিনের ফলাফলে প্রদর্শিত শিরোনাম। খালি রাখলে সাইটের নাম ব্যবহার করা হবে।
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoDescription"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>এসইও বিবরণ</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="সেরা হিমসাগর আম, সুন্দরবনের মধু এবং আরও অনেক কিছু কিনুন..."
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                সার্চ ইঞ্জিনের ফলাফলে প্রদর্শিত বিবরণ। খালি রাখলে সাইটের বিবরণ ব্যবহার করা হবে।
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="seoKeywords"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>এসইও কীওয়ার্ড</FormLabel>
                            <FormControl>
                                <Input placeholder="আম, মধু, খেজুর, অর্গানিক, বাংলাদেশ" {...field} />
                            </FormControl>
                            <FormDescription>
                                কমা দ্বারা পৃথক করে কীওয়ার্ড লিখুন।
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              </TabsContent>
              <TabsContent value="payments" className="mt-6">
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="mobileBankingEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            মোবাইল ব্যাংকিং সক্ষম করুন
                          </FormLabel>
                          <FormDescription>
                            আপনার গ্রাহকদের মোবাইল ব্যাংকিং এর মাধ্যমে পেমেন্ট করার অনুমতি দিন।
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
                    name="mobileBankingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>মোবাইল ব্যাংকিং নম্বর</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 01234567890" {...field} />
                        </FormControl>
                        <FormDescription>
                          গ্রাহকরা যে নম্বরে পেমেন্ট পাঠাবে।
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="acceptedBankingMethods"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">গৃহীত পদ্ধতি</FormLabel>
                          <FormDescription>
                            আপনি কোন মোবাইল ব্যাংকিং পরিষেবাগুলি গ্রহণ করেন তা নির্বাচন করুন।
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          {availableBankingMethods.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="acceptedBankingMethods"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                পরিবর্তনগুলি সংরক্ষণ করুন
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
