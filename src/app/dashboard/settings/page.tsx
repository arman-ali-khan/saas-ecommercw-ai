
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
import { Globe, BarChart, CreditCard, Loader2, Facebook, Twitter } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import ImageUploader from '@/components/image-uploader';
import Image from 'next/image';

const generalSettingsSchema = z.object({
  platformName: z.string().min(2, { message: 'Platform name must be at least 2 characters.' }),
  platformDescription: z.string().min(10, { message: 'Platform description must be at least 10 characters.' }),
  logo_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  favicon_url: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  base_domain: z.string().optional().or(z.literal('')),
  social_facebook: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  social_twitter: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  social_tiktok: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
});

const seoSettingsSchema = z.object({
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
});

const availableBankingMethods = [
  { id: 'bkash', label: 'বিকাশ' },
  { id: 'nagad', label: 'নগদ' },
  { id: 'rocket', label: 'রকেট' },
  { id: 'upay', label: 'উপায়' },
];

const paymentSettingsSchema = z.object({
  mobileBankingEnabled: z.boolean().default(false),
  mobileBankingNumber: z.string().optional(),
  acceptedBankingMethods: z.array(z.string()).default([]),
});

const TikTokIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"><path d="M12.52.02c1.31-.02 2.61.01 3.91.02.08 1.53.01 3.07.01 4.6 0 1.1.35 2.21 1.22 3.01.91.82 2.1 1.25 3.32 1.19.08 1.5.01 3 .01 4.5a5.42 5.42 0 0 1-5.12 5.14c-1.53.08-3.07.01-4.6.01-1.1 0-2.21-.35-3.01-1.22-.82-.91-1.25-2.1-1.19-3.32-.08-1.5-.01-3-.01-4.5a5.42 5.42 0 0 1 5.12-5.14Z"></path><path d="M9 8.5h4"></path><path d="M9 12.5h4"></path><path d="M13.5 4.5v4"></path></svg>
);


export default function SaasSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneralSubmitting, setIsGeneralSubmitting] = useState(false);
  const [isSeoSubmitting, setIsSeoSubmitting] = useState(false);
  const [isPaymentSubmitting, setIsPaymentSubmitting] = useState(false);

  const generalForm = useForm<z.infer<typeof generalSettingsSchema>>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      platformName: '',
      platformDescription: '',
      logo_url: '',
      favicon_url: '',
      base_domain: '',
      social_facebook: '',
      social_twitter: '',
      social_tiktok: '',
    },
  });

  const seoForm = useForm<z.infer<typeof seoSettingsSchema>>({
    resolver: zodResolver(seoSettingsSchema),
    defaultValues: {
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    },
  });

  const paymentForm = useForm<z.infer<typeof paymentSettingsSchema>>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      mobileBankingEnabled: false,
      mobileBankingNumber: '',
      acceptedBankingMethods: [],
    },
  });
  
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'settings' }),
        });
        const result = await response.json();

        if (response.ok && result.data) {
            const data = result.data;
            generalForm.reset({
                platformName: data.platform_name || '',
                platformDescription: data.platform_description || '',
                logo_url: data.logo_url || '',
                favicon_url: data.favicon_url || '',
                base_domain: data.base_domain || '',
                social_facebook: data.social_facebook || '',
                social_twitter: data.social_twitter || '',
                social_tiktok: data.social_tiktok || '',
            });
            seoForm.reset({
                seoTitle: data.seo_title || '',
                seoDescription: data.seo_description || '',
                seoKeywords: data.seo_keywords || '',
            });
            paymentForm.reset({
                mobileBankingEnabled: data.mobile_banking_enabled || false,
                mobileBankingNumber: data.mobile_banking_number || '',
                acceptedBankingMethods: data.accepted_banking_methods || [],
            });
        } else {
            throw new Error(result.error || 'Failed to fetch settings');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error fetching settings', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [generalForm, seoForm, paymentForm, toast]);
  
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function onGeneralSubmit(values: z.infer<typeof generalSettingsSchema>) {
    setIsGeneralSubmitting(true);
    try {
      const { error } = await supabase
        .from('saas_settings')
        .upsert({
            id: 1,
            platform_name: values.platformName,
            platform_description: values.platformDescription,
            logo_url: values.logo_url,
            favicon_url: values.favicon_url,
            base_domain: values.base_domain,
            social_facebook: values.social_facebook,
            social_twitter: values.social_twitter,
            social_tiktok: values.social_tiktok,
        });

      if (error) {
        toast({ variant: 'destructive', title: 'Error Saving General Settings', description: error.message });
      } else {
        toast({ title: 'General Settings Saved!' });
        await fetchSettings();
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
    } finally {
      setIsGeneralSubmitting(false);
    }
  }

  async function onSeoSubmit(values: z.infer<typeof seoSettingsSchema>) {
    setIsSeoSubmitting(true);
    try {
        const { error } = await supabase
            .from('saas_settings')
            .upsert({
                id: 1,
                seo_title: values.seoTitle,
                seo_description: values.seoDescription,
                seo_keywords: values.seoKeywords,
            });

        if (error) {
            toast({ variant: 'destructive', title: 'Error Saving SEO Settings', description: error.message });
        } else {
            toast({ title: 'SEO Settings Saved!' });
            await fetchSettings();
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
    } finally {
        setIsSeoSubmitting(false);
    }
  }


  async function onPaymentSubmit(values: z.infer<typeof paymentSettingsSchema>) {
    setIsPaymentSubmitting(true);
    try {
        const { error } = await supabase
            .from('saas_settings')
            .upsert({
                id: 1,
                mobile_banking_enabled: values.mobileBankingEnabled,
                mobile_banking_number: values.mobileBankingNumber,
                accepted_banking_methods: values.acceptedBankingMethods,
            });

        if (error) {
            toast({ variant: 'destructive', title: 'Error Saving Settings', description: error.message });
        } else {
            toast({ title: 'Payment Settings Saved!', description: 'Subscription payment settings have been updated.' });
            await fetchSettings();
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
    } finally {
        setIsPaymentSubmitting(false);
    }
  }

  const handleLogoUpload = (result: any) => {
    if (result.event === 'success') {
      const secureUrl = result.info.secure_url;
      generalForm.setValue('logo_url', secureUrl, { shouldValidate: true });
      toast({ title: 'Logo Uploaded', description: 'Click "Save" to apply the changes.' });
    }
  };

  const handleFaviconUpload = (result: any) => {
    if (result.event === 'success') {
      const secureUrl = result.info.secure_url;
      generalForm.setValue('favicon_url', secureUrl, { shouldValidate: true });
      toast({ title: 'Favicon Uploaded', description: 'Click "Save" to apply the changes.' });
    }
  };

  const logoUrl = generalForm.watch('logo_url');
  const faviconUrl = generalForm.watch('favicon_url');

  const isLogoUrlValid = useMemo(() => {
    if (!logoUrl) return false;
    try {
      new URL(logoUrl);
      return true;
    } catch {
      return false;
    }
  }, [logoUrl]);
  
  const isFaviconUrlValid = useMemo(() => {
    if (!faviconUrl) return false;
    try {
      new URL(faviconUrl);
      return true;
    } catch {
      return false;
    }
  }, [faviconUrl]);


  return (
    <div className='space-y-6'>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">SaaS Platform Settings</h1>
        <p className="text-muted-foreground">Manage your platform's global settings.</p>
      </div>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general"><Globe className='mr-2 h-4 w-4' /> General</TabsTrigger>
          <TabsTrigger value="seo"><BarChart className='mr-2 h-4 w-4' /> SEO</TabsTrigger>
          <TabsTrigger value="payments"><CreditCard className='mr-2 h-4 w-4' /> Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Update your platform's public-facing name, description, and branding.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generalForm}>
                <form onSubmit={generalForm.handleSubmit(onGeneralSubmit)} className="space-y-8">
                  <FormField
                    control={generalForm.control}
                    name="platformName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your SaaS Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be displayed on the main landing page and in browser tabs.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="platformDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="A short description of your platform..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief summary of your SaaS platform.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="base_domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Domain URL</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., myapp.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          The main domain for user sites (e.g., your-store.myapp.com).
                          <br />
                          <strong className="text-destructive">Important:</strong> For routing to work correctly, this value must also be set in an environment variable named <code>NEXT_PUBLIC_BASE_DOMAIN</code> and your server must be restarted.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={generalForm.control}
                    name="logo_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Logo</FormLabel>
                        <div className="flex items-center gap-4">
                           {isLogoUrlValid ? (
                            <div className="relative h-16 w-16 shrink-0 rounded-md border p-1 bg-white">
                                <Image src={logoUrl!} alt="Logo preview" fill className="object-contain" />
                            </div>
                           ) : (
                            <div className="h-16 w-16 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                <p className="text-xs text-muted-foreground text-center">Preview</p>
                            </div>
                           )}
                           <div className='flex-grow space-y-2'>
                              <FormControl>
                                <Input placeholder="https://example.com/logo.png" {...field} />
                              </FormControl>
                              <FormDescription>
                                Upload a new logo or paste an image URL.
                              </FormDescription>
                           </div>
                          <ImageUploader onUpload={handleLogoUpload} label='Upload' />
                        </div>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={generalForm.control}
                    name="favicon_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Platform Favicon</FormLabel>
                        <div className="flex items-center gap-4">
                           {isFaviconUrlValid ? (
                            <div className="relative h-16 w-16 shrink-0 rounded-md border p-1 bg-white">
                                <Image src={faviconUrl!} alt="Favicon preview" fill className="object-contain" />
                            </div>
                           ) : (
                            <div className="h-16 w-16 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                <p className="text-xs text-muted-foreground text-center">Preview</p>
                            </div>
                           )}
                           <div className='flex-grow space-y-2'>
                              <FormControl>
                                <Input placeholder="https://example.com/favicon.ico" {...field} />
                              </FormControl>
                              <FormDescription>
                                Upload a favicon (.ico, .png, .svg). Recommended size: 32x32px.
                              </FormDescription>
                           </div>
                          <ImageUploader onUpload={handleFaviconUpload} label='Upload Favicon' />
                        </div>
                         <FormMessage />
                      </FormItem>
                    )}
                  />


                  <div className="space-y-4 rounded-lg border p-4">
                      <h3 className="text-sm font-medium">Social Media Links</h3>
                      <FormField
                        control={generalForm.control}
                        name="social_facebook"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Facebook</FormLabel>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                <Input placeholder="https://facebook.com/yourpage" {...field} className="pl-10" />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={generalForm.control}
                        name="social_twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Twitter</FormLabel>
                             <div className="relative">
                                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <FormControl>
                                <Input placeholder="https://twitter.com/yourprofile" {...field} className="pl-10" />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={generalForm.control}
                        name="social_tiktok"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">TikTok</FormLabel>
                             <div className="relative">
                                <TikTokIcon />
                                <FormControl>
                                <Input placeholder="https://tiktok.com/@yourprofile" {...field} className="pl-10" />
                                </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  
                  <Button type="submit" disabled={isGeneralSubmitting || isLoading}>
                    {isGeneralSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save General Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization (SEO)</CardTitle>
              <CardDescription>Manage SEO settings for your main landing page.</CardDescription>
            </CardHeader>
            <CardContent>
               <Form {...seoForm}>
                 <form onSubmit={seoForm.handleSubmit(onSeoSubmit)} className="space-y-8">
                    <FormField
                        control={seoForm.control}
                        name="seoTitle"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SEO Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Your Platform - The Best Solution For..." {...field} />
                            </FormControl>
                            <FormDescription>
                                The title that appears in search engine results. If empty, the platform name will be used.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={seoForm.control}
                        name="seoDescription"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SEO Description</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="A compelling description for search engines..."
                                    rows={3}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                The description that appears in search engine results. If empty, the platform description will be used.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={seoForm.control}
                        name="seoKeywords"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>SEO Keywords</FormLabel>
                            <FormControl>
                                <Input placeholder="keyword1, keyword2, keyword3" {...field} />
                            </FormControl>
                            <FormDescription>
                                Comma-separated keywords related to your platform.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={isSeoSubmitting || isLoading}>
                        {isSeoSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save SEO Settings
                    </Button>
                </form>
               </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
            <Card>
                <CardHeader>
                    <CardTitle>Subscription Payment Settings</CardTitle>
                    <CardDescription>Configure how users pay for their subscription plans.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...paymentForm}>
                        <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-6">
                            <FormField
                                control={paymentForm.control}
                                name="mobileBankingEnabled"
                                render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                    <FormLabel className="text-base">
                                        Enable Mobile Banking for Subscriptions
                                    </FormLabel>
                                    <FormDescription>
                                        Allow users to pay for their plans using mobile banking.
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
                                control={paymentForm.control}
                                name="mobileBankingNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mobile Banking Merchant Number</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., 01234567890" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                    The number users will send subscription payments to.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={paymentForm.control}
                                name="acceptedBankingMethods"
                                render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                    <FormLabel className="text-base">Accepted Methods</FormLabel>
                                    <FormDescription>
                                        Select which mobile banking services you accept for subscriptions.
                                    </FormDescription>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    {availableBankingMethods.map((item) => (
                                        <FormField
                                        key={item.id}
                                        control={paymentForm.control}
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
                                                        ? field.onChange([...(field.value ?? []), item.id])
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
                            <div className="pt-4">
                                <Button type="submit" disabled={isPaymentSubmitting || isLoading}>
                                    {isPaymentSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Payment Settings
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
