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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Loader2, Copy, Sparkles, CheckCircle, Palette, Trash2, Globe, BarChart, CreditCard, ShieldCheck, AlertTriangle, Wallet } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import IconPicker from '@/components/icon-picker';
import ImageUploader from '@/components/image-uploader';
import Image from 'next/image';
import DynamicIcon from '@/components/dynamic-icon';
import { type SeoRequest, type Plan } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';


const availableBankingMethods = [
  { id: 'bkash', label: 'বিকাশ' },
  { id: 'nagad', label: 'নগদ' },
  { id: 'rocket', label: 'রকেট' },
  { id: 'upay', label: 'উপায়' },
];

const settingsSchema = z.object({
  siteName: z.string().min(2, { message: 'সাইটের নাম কমপক্ষে ২ অক্ষরের হতে হবে।' }),
  siteDescription: z.string().min(10, { message: 'সাইটের বিবরণ কমপক্ষে ১০ অক্ষরের হতে হবে।' }),
});

const seoSchema = z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
});

const paymentSchema = z.object({
  mobileBankingEnabled: z.boolean().default(false),
  mobileBankingNumber: z.string().optional(),
  mobileBankingType: z.enum(['personal', 'agent', 'merchant']).default('personal'),
  acceptedBankingMethods: z.array(z.string()).default([]),
});

const brandingSchema = z.object({
    logo_type: z.enum(['icon', 'image']).default('icon'),
    logo_icon: z.string().default('Leaf'),
    logo_image_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    favicon_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    social_share_image_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

const subscriptionChangeSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'mobile_banking']).default('credit_card'),
  transactionId: z.string().optional(),
}).refine(data => {
    if (data.paymentMethod === 'mobile_banking') {
        return !!data.transactionId && data.transactionId.trim() !== '';
    }
    return true;
}, {
    message: "Transaction ID is required for manual payment.",
    path: ["transactionId"]
});

type SubscriptionChangeFormData = z.infer<typeof subscriptionChangeSchema>;


export default function SettingsAdminPage() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [robotsUrl, setRobotsUrl] = useState('');
  const [seoRequest, setSeoRequest] = useState<SeoRequest | null>(null);
  const [isSeoRequestLoading, setIsSeoRequestLoading] = useState(true);
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);
  const [isFreePlanConfirmOpen, setIsFreePlanConfirmOpen] = useState(false);
  const [planToChange, setPlanToChange] = useState<Plan | null>(null);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { siteName: '', siteDescription: '' },
  });

  const seoForm = useForm<z.infer<typeof seoSchema>>({
    resolver: zodResolver(seoSchema),
    defaultValues: { seoTitle: '', seoDescription: '', seoKeywords: ''},
  });

  const paymentForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { mobileBankingEnabled: false, mobileBankingNumber: '', mobileBankingType: 'personal', acceptedBankingMethods: []},
  });

  const brandingForm = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: { logo_type: 'icon', logo_icon: 'Leaf', logo_image_url: '', favicon_url: '', social_share_image_url: '' },
  });
  
  const subscriptionChangeForm = useForm<SubscriptionChangeFormData>({
    resolver: zodResolver(subscriptionChangeSchema),
    defaultValues: { paymentMethod: 'credit_card', transactionId: '' },
  });

  const watchedSubMethod = subscriptionChangeForm.watch('paymentMethod');

  const fetchSettingsData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
        const response = await fetch('/api/settings/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id }),
        });
        const result = await response.json();

        if (response.ok) {
            const { profile, settings, plans: fetchedPlans } = result;

            setPlans(fetchedPlans);
            setIsLoadingPlans(false);

            form.reset({
                siteName: profile.site_name || '',
                siteDescription: profile.site_description || '',
            });

            seoForm.reset({
                seoTitle: settings.seo_title || '',
                seoDescription: settings.seo_description || '',
                seoKeywords: settings.seo_keywords || '',
            });

            paymentForm.reset({
                mobileBankingEnabled: settings.mobile_banking_enabled ?? false,
                mobileBankingNumber: settings.mobile_banking_number || '',
                mobileBankingType: settings.mobile_banking_type || 'personal',
                acceptedBankingMethods: settings.accepted_banking_methods || [],
            });

            brandingForm.reset({
                logo_type: settings.logo_type || 'icon',
                logo_icon: settings.logo_icon || 'Leaf',
                logo_image_url: settings.logo_image_url || '',
                favicon_url: settings.favicon_url || '',
                social_share_image_url: settings.social_share_image_url || '',
            });

            const { data: seoReq } = await supabase.from('seo_requests').select('*').eq('site_id', user.id).order('created_at', { ascending: false }).limit(1).single();
            if (seoReq) setSeoRequest(seoReq as SeoRequest);
            setIsSeoRequestLoading(false);

        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [user, form, seoForm, paymentForm, brandingForm, toast]);

  useEffect(() => {
    if (user) {
        const protocol = window.location.protocol;
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
        setSitemapUrl(`${protocol}//${user.domain}.${baseDomain}/sitemap.xml`);
        setRobotsUrl(`${protocol}//${user.domain}.${baseDomain}/robots.txt`);
        fetchSettingsData();
    }
  }, [user, fetchSettingsData]);

  async function onGeneralSubmit(values: z.infer<typeof settingsSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
        const response = await fetch('/api/settings/save-general', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id, siteName: values.siteName, siteDescription: values.siteDescription }),
        });

        if (response.ok) {
            toast({ title: 'General settings saved!' });
            await refreshUser();
        } else {
            const res = await response.json();
            throw new Error(res.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error updating site info', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function onSeoSubmit(values: z.infer<typeof seoSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/settings/save-seo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id, ...values }),
        });

        if (response.ok) {
            toast({ title: 'SEO settings saved!' });
        } else {
            const res = await response.json();
            throw new Error(res.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving SEO settings', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function onPaymentSubmit(values: z.infer<typeof paymentSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/settings/save-payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id, ...values }),
        });

        if (response.ok) {
            toast({ title: 'Payment settings saved!' });
        } else {
            const res = await response.json();
            throw new Error(res.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving payment settings', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function onBrandingSubmit(values: z.infer<typeof brandingSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/settings/save-branding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id, ...values }),
        });

        if (response.ok) {
            toast({ title: 'Branding settings saved!' });
        } else {
            const res = await response.json();
            throw new Error(res.error);
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error saving branding settings', description: error.message });
    } finally {
        setIsSubmitting(false);
    }
  }

  async function handleSeoRequest() {
    if (!user) return;
    setIsSubmitting(true);
    
    try {
        const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', user.id);

        if (countError) {
            throw new Error('Could not get product count.');
        }

        const { error } = await supabase.from('seo_requests').insert({
            site_id: user.id,
            status: 'pending',
            product_count: count || 0,
            user_name: user.fullName,
            user_email: user.email,
            site_domain: user.domain,
            site_name: user.siteName,
        });

        if(error) throw error;

        // Create notification for SaaS Admin
        await fetch('/api/notifications/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientType: 'admin',
                siteId: user.id,
                message: `New SEO Review Request from "${user.siteName}" (@${user.domain}).`,
                link: '/dashboard/seo-requests',
            }),
        });

        toast({ title: 'SEO request submitted!', description: 'You will be notified when the review is complete.' });
        const { data } = await supabase.from('seo_requests').select('*').eq('site_id', user.id).order('created_at', { ascending: false }).limit(1).single();
        if (data) setSeoRequest(data as SeoRequest);

    } catch (err: any) {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
    } finally {
        setIsSubmitting(false);
    }
  }

    const handlePlanChangeClick = (plan: Plan) => {
        if (!user || plan.id === user.subscriptionPlan) return;
        setPlanToChange(plan);
        if (plan.id === 'free') {
            setIsFreePlanConfirmOpen(true);
        } else {
            setIsChangePlanDialogOpen(true);
        }
    };

    const handleFreePlanSwitch = async () => {
        if (!user || !planToChange) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/settings/request-plan-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    siteId: user.id, 
                    planId: 'free', 
                    amount: 0, 
                    transactionId: `FREE_SWITCH_${Date.now()}`
                }),
            });

            if (response.ok) {
                toast({ title: 'Downgrade Request Submitted', description: 'Your request to switch to the Free plan is under review.' });
                await refreshUser();
            } else {
                const res = await response.json();
                throw new Error(res.error);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
        } finally {
            setIsSubmitting(false);
            setIsFreePlanConfirmOpen(false);
        }
    }

    const onSubscriptionChangeSubmit = async (data: SubscriptionChangeFormData) => {
        if (!user || !planToChange) return;

        setIsSubmitting(true);

        if (data.paymentMethod === 'credit_card') {
            try {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const response = await fetch('/api/saas/payments/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId: planToChange.id,
                        planName: planToChange.name,
                        amount: planToChange.price,
                        siteId: user.id,
                        email: user.email,
                        successUrl: `${origin}/admin/settings?payment=success`,
                        cancelUrl: `${origin}/admin/settings?payment=cancel`,
                    }),
                });

                const result = await response.json();
                if (result.url) {
                    window.location.href = result.url;
                } else {
                    throw new Error(result.error || 'Checkout failed');
                }
            } catch (e: any) {
                toast({ variant: 'destructive', title: 'Error', description: e.message });
                setIsSubmitting(false);
            }
            return;
        }

        // Manual Mobile Banking Flow
        try {
            const response = await fetch('/api/settings/request-plan-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    siteId: user.id, 
                    planId: planToChange.id, 
                    amount: planToChange.price, 
                    transactionId: data.transactionId 
                }),
            });

            if (response.ok) {
                // Also create SaaS Admin notification
                await fetch('/api/notifications/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipientType: 'admin',
                        siteId: user.id,
                        message: `New manual payment submitted by "${user.siteName}" (@${user.domain}) for plan: ${planToChange.name}.`,
                        link: '/dashboard/subscriptions',
                    }),
                });

                toast({ title: 'Upgrade Request Submitted', description: 'Your request is under review. You will be notified upon approval.' });
                await refreshUser();
            } else {
                const res = await response.json();
                throw new Error(res.error);
            }
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error submitting request', description: e.message });
        } finally {
            setIsSubmitting(false);
            setIsChangePlanDialogOpen(false);
        }
    };

  const handleLogoUpload = (result: any) => {
    if (result.event === 'success') {
      const secureUrl = result.info.secure_url;
      brandingForm.setValue('logo_image_url', secureUrl, { shouldValidate: true });
      toast({ title: 'Image Uploaded', description: 'Click "Save" to apply the changes.' });
    }
  };
  
  const handleFaviconUpload = (result: any) => {
    if (result.event === 'success') {
      const secureUrl = result.info.secure_url;
      brandingForm.setValue('favicon_url', secureUrl, { shouldValidate: true });
      toast({ title: 'Favicon Uploaded', description: 'Click "Save" to apply the changes.' });
    }
  };
  
  const handleSocialShareImageUpload = (result: any) => {
    if (result.event === 'success') {
      const secureUrl = result.info.secure_url;
      brandingForm.setValue('social_share_image_url', secureUrl, { shouldValidate: true });
      toast({ title: 'Image Uploaded', description: 'Click "Save" to apply the changes.' });
    }
  };

  const logoType = brandingForm.watch('logo_type');
  const logoImageUrl = brandingForm.watch('logo_image_url');
  const logoIcon = brandingForm.watch('logo_icon');
  const faviconUrl = brandingForm.watch('favicon_url');
  const socialShareImageUrl = brandingForm.watch('social_share_image_url');
  const currentPlan = useMemo(() => plans.find(p => p.id === user?.subscriptionPlan), [plans, user]);

  const isLogoUrlValid = useMemo(() => {
    if (!logoImageUrl) return false;
    try {
      new URL(logoImageUrl);
      return true;
    } catch {
      return false;
    }
  }, [logoImageUrl]);
  
  const isFaviconUrlValid = useMemo(() => {
    if (!faviconUrl) return false;
    try {
      new URL(faviconUrl);
      return true;
    } catch {
      return false;
    }
  }, [faviconUrl]);

  const isSocialShareUrlValid = useMemo(() => {
    if (!socialShareImageUrl) return false;
    try {
        new URL(socialShareImageUrl);
        return true;
    } catch {
        return false;
    }
  }, [socialShareImageUrl]);

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-80" />
            </div>
            <Card>
                <CardHeader className="border-b">
                    <div className="flex gap-4">
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <Skeleton className="h-10 w-40 rounded-md" />
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>সাইট সেটিংস</CardTitle>
        <CardDescription>
          আপনার সাইটের সাধারণ তথ্য, ব্র্যান্ডিং এবং পেমেন্ট বিবরণ পরিচালনা করুন।
        </CardDescription>
      </CardHeader>
      <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto">
              <TabsTrigger value="general">সাধারণ</TabsTrigger>
              <TabsTrigger value="branding">ব্র্যান্ডিং</TabsTrigger>
              <TabsTrigger value="seo">এসইও</TabsTrigger>
              <TabsTrigger value="payments">পেমেন্ট</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="mt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onGeneralSubmit)} className="space-y-8">
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
                         <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                সাধারণ সেটিংস সংরক্ষণ করুন
                            </Button>
                        </div>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="branding" className="mt-6">
                <Form {...brandingForm}>
                    <form onSubmit={brandingForm.handleSubmit(onBrandingSubmit)} className="space-y-8">
                         <FormField
                            control={brandingForm.control}
                            name="logo_type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>লোগোর ধরন</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex gap-4"
                                        >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="icon" />
                                            </FormControl>
                                            <FormLabel className="font-normal">আইকন</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl>
                                            <RadioGroupItem value="image" />
                                            </FormControl>
                                            <FormLabel className="font-normal">ছবি</FormLabel>
                                        </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {logoType === 'icon' ? (
                             <FormField
                                control={brandingForm.control}
                                name="logo_icon"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>লোগো আইকন</FormLabel>
                                    <FormControl>
                                        <IconPicker value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormDescription>আপনার ব্র্যান্ডের প্রতিনিধিত্ব করার জন্য একটি আইকন নির্বাচন করুন।</FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        ) : (
                            <FormField
                                control={brandingForm.control}
                                name="logo_image_url"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>লোগো ছবি</FormLabel>
                                    <div className="flex flex-col items-start gap-4">
                                        <div className="relative h-24 w-24 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                            {isLogoUrlValid ? (
                                                <Image src={logoImageUrl!} alt="Logo Preview" fill className="object-contain p-2" />
                                            ) : logoIcon ? (
                                                <DynamicIcon name={logoIcon} className="h-10 w-10 text-muted-foreground" />
                                            ) : null}
                                        </div>
                                        <div className='flex-grow space-y-2'>
                                            <FormControl>
                                                <Input placeholder="https://example.com/logo.png" {...field} />
                                            </FormControl>
                                            <ImageUploader onUpload={handleLogoUpload} label='আপলোড করুন' />
                                            <FormDescription>
                                                একটি নতুন লোগো আপলোড করুন বা একটি ছবির URL পেস্ট করুন।
                                            </FormDescription>
                                        </div>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        )}
                        <FormField
                            control={brandingForm.control}
                            name="favicon_url"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Favicon</FormLabel>
                                <div className="flex flex-col items-start gap-4">
                                    <div className="relative h-16 w-16 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                        {isFaviconUrlValid ? (
                                            <Image src={faviconUrl!} alt="Favicon Preview" fill className="object-contain p-1" />
                                        ) : <p className='text-xs text-muted-foreground'>Preview</p>}
                                    </div>
                                    <div className='flex-grow space-y-2'>
                                        <FormControl>
                                            <Input placeholder="https://example.com/favicon.ico" {...field} />
                                        </FormControl>
                                        <ImageUploader onUpload={handleFaviconUpload} label='Upload Favicon' />
                                        <FormDescription>
                                            Upload a favicon (.ico, .png, .svg). Recommended size: 32x32px.
                                        </FormDescription>
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={brandingForm.control}
                            name="social_share_image_url"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Social Share Image</FormLabel>
                                <div className="flex flex-col items-start gap-4">
                                    <div className="relative h-24 sm:w-48 w-28 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">
                                        {isSocialShareUrlValid ? (
                                            <Image src={socialShareImageUrl!} alt="Social Share Preview" fill className="object-contain p-1" />
                                        ) : <p className='text-xs text-muted-foreground'>Preview</p>}
                                    </div>
                                    <div className='flex-grow space-y-2'>
                                        <FormControl>
                                            <Input placeholder="https://example.com/social.png" {...field} />
                                        </FormControl>
                                        <ImageUploader onUpload={handleSocialShareImageUpload} label='Upload Social Image' />
                                        <FormDescription>
                                            The image shown when sharing links. Recommended: 1200x630px.
                                        </FormDescription>
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                ব্র্যান্ডিং সেটিংস সংরক্ষণ করুন
                            </Button>
                        </div>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="seo" className="mt-6">
                <Form {...seoForm}>
                    <form onSubmit={seoForm.handleSubmit(onSeoSubmit)} className="space-y-8">
                        <FormField
                            control={seoForm.control}
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
                            control={seoForm.control}
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
                            control={seoForm.control}
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
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Sitemap & Robots.txt</CardTitle>
                                <CardDescription>
                                    These files are automatically generated to help search engines index your content.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormItem>
                                    <FormLabel>Sitemap URL</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <Input value={sitemapUrl} readOnly />
                                        </FormControl>
                                        <Button type="button" variant="outline" size="icon" onClick={() => {
                                            navigator.clipboard.writeText(sitemapUrl);
                                            toast({ title: 'Sitemap URL copied!' });
                                        }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>Robots.txt URL</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <Input value={robotsUrl} readOnly />
                                        </FormControl>
                                        <Button type="button" variant="outline" size="icon" onClick={() => {
                                            navigator.clipboard.writeText(robotsUrl);
                                            toast({ title: 'robots.txt URL copied!' });
                                        }}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </FormItem>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Professional SEO Review</CardTitle>
                                <CardDescription>
                                    Request a professional SEO audit and optimization service from our team to boost your store's visibility.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isSeoRequestLoading ? <Loader2 className="animate-spin" /> : (
                                    seoRequest?.status === 'pending' ? (
                                        <p className="text-muted-foreground">Your SEO review request is currently <span className="font-bold text-amber-500">pending</span>. Our team will get back to you soon.</p>
                                    ) : seoRequest?.status === 'completed' ? (
                                         <p className="text-muted-foreground">Your last SEO review was <span className="font-bold text-green-500">completed</span>. You can request a new review if needed.</p>
                                    ) : (
                                        <Button onClick={handleSeoRequest} disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            <Sparkles className="mr-2 h-4 w-4" /> Request SEO Review
                                        </Button>
                                    )
                                )}
                            </CardContent>
                        </Card>


                        <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                এসইও সেটিংস সংরক্ষণ করুন
                            </Button>
                        </div>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="payments" className="mt-6">
                <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-8">
                        <FormField
                            control={paymentForm.control}
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
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField
                                control={paymentForm.control}
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
                                control={paymentForm.control}
                                name="mobileBankingType"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>নম্বরের ধরন (Number Type)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="সিলেক্ট করুন" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="personal">Personal (ব্যক্তিগত)</SelectItem>
                                            <SelectItem value="agent">Agent (এজেন্ট)</SelectItem>
                                            <SelectItem value="merchant">Merchant (মার্চেন্ট)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        এটি চেকআউট পেজে গ্রাহককে সঠিক পেমেন্ট নির্দেশনা দিতে সাহায্য করবে।
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={paymentForm.control}
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
                         <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                পেমেন্ট সেটিংস সংরক্ষণ করুন
                            </Button>
                        </div>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="subscription" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Subscription Management</CardTitle>
                        <CardDescription>View your current plan and manage your subscription.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                         {isLoadingPlans || !currentPlan ? (
                            <Skeleton className="h-48 w-full" />
                         ) : (
                            <Card className="bg-muted/50 border-2">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-2xl">Your Current Plan: {currentPlan.name}</CardTitle>
                                            <CardDescription>{currentPlan.description}</CardDescription>
                                        </div>
                                        <Badge className="px-4 py-1">{user?.subscription_status}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold font-headline">
                                        {currentPlan.price === 0 ? 'Free' : `৳${currentPlan.price}`}
                                        <span className="text-sm font-normal text-muted-foreground">{currentPlan.period}</span>
                                    </p>
                                    {user?.subscription_end_date && (
                                        <p className="text-xs text-muted-foreground mt-2 font-bold uppercase tracking-widest">Expires on: {new Date(user.subscription_end_date).toLocaleDateString()}</p>
                                    )}
                                </CardContent>
                            </Card>
                         )}
                         <div className="space-y-4">
                            <h3 className="font-bold text-lg border-l-4 border-primary pl-3">Available Plans</h3>
                            <div className="grid md:grid-cols-2 gap-6">
                                {plans.filter(p => p.id !== user?.subscriptionPlan).map(plan => (
                                    <Card key={plan.id} className="flex flex-col border-2 hover:border-primary/30 transition-all group overflow-hidden">
                                        <CardHeader className="bg-muted/30">
                                            <CardTitle>{plan.name}</CardTitle>
                                            <CardDescription className="line-clamp-1">{plan.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="pt-6 flex-grow">
                                            <p className="text-3xl font-black font-headline text-primary">
                                                {plan.price === 0 ? 'Free' : `৳${plan.price}`}
                                                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                                            </p>
                                            <ul className="mt-6 space-y-3 text-sm">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> <span className="text-muted-foreground">{feature}</span></li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="bg-muted/10 pt-4">
                                            <Button className="w-full rounded-xl font-bold" onClick={() => handlePlanChangeClick(plan)} disabled={user?.subscription_status === 'pending_verification'}>
                                                {user?.subscription_status === 'pending_verification' ? 'Upgrade Pending' : `Switch to ${plan.name}`}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                         </div>
                    </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
      </CardContent>
    </Card>

    {/* Upgrade Plan Dialog */}
    <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-2 shadow-2xl">
          <DialogHeader className="bg-primary p-8 text-primary-foreground">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-2xl">
                    <CreditCard className="h-8 w-8" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black">Upgrade to {planToChange?.name}</DialogTitle>
                    <DialogDescription className="text-primary-foreground/80 font-bold">
                        Please choose your preferred payment method to activate this plan.
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
          
          <div className="p-8 space-y-8">
            <Form {...subscriptionChangeForm}>
                <form onSubmit={subscriptionChangeForm.handleSubmit(onSubscriptionChangeSubmit)} className="space-y-8">
                    <FormField
                        control={subscriptionChangeForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem className="space-y-4">
                                <FormLabel className="text-sm font-black uppercase tracking-widest text-muted-foreground">Choose Payment Method</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                    >
                                        <Label 
                                            htmlFor="up-pm-stripe" 
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-2xl border-2 p-6 cursor-pointer transition-all",
                                                field.value === 'credit_card' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/10" : "border-muted hover:border-primary/20"
                                            )}
                                        >
                                            <RadioGroupItem value="credit_card" id="up-pm-stripe" className="sr-only" />
                                            <CreditCard className={cn("h-8 w-8 mb-3 transition-colors", field.value === 'credit_card' ? "text-primary" : "text-muted-foreground")} />
                                            <p className="font-bold text-base">Debit / Credit Card</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Instant Activation</p>
                                        </Label>

                                        <Label 
                                            htmlFor="up-pm-mobile" 
                                            className={cn(
                                                "flex flex-col items-center justify-center rounded-2xl border-2 p-6 cursor-pointer transition-all",
                                                field.value === 'mobile_banking' ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" : "border-muted hover:border-primary/20"
                                            )}
                                        >
                                            <RadioGroupItem value="mobile_banking" id="up-pm-mobile" className="sr-only" />
                                            <Wallet className={cn("h-8 w-8 mb-3 transition-colors", field.value === 'mobile_banking' ? "text-primary" : "text-muted-foreground")} />
                                            <p className="font-bold text-base">Mobile Banking</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Manual Verification</p>
                                        </Label>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    {watchedSubMethod === 'mobile_banking' && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                            <div className="text-sm text-muted-foreground bg-muted/50 p-6 rounded-2xl border-2 border-dashed">
                                <h3 className="font-bold mb-3 text-foreground flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-primary" /> Mobile Banking Instructions</h3>
                                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                                    <li>Open your preferred mobile banking app.</li>
                                    <li>Select the "Payment" or "Send Money" option.</li>
                                    <li>Enter our merchant/admin number: <strong>{paymentForm.getValues('mobileBankingNumber') || '...'}</strong></li>
                                    <li>Enter the amount: <strong>৳{planToChange?.price.toFixed(2)}</strong></li>
                                    <li>After payment, enter the Transaction ID below.</li>
                                </ol>
                            </div>
                            <FormField
                                control={subscriptionChangeForm.control}
                                name="transactionId"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold">Transaction ID (TxnID)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., 8N7F6G5H4J" {...field} className="h-12 rounded-xl border-2 focus:border-primary font-mono text-lg font-bold" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    )}

                    <DialogFooter className="gap-3 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setIsChangePlanDialogOpen(false)} className="rounded-xl h-12 px-8">Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="flex-grow sm:flex-none h-12 px-10 rounded-xl font-bold shadow-xl shadow-primary/20">
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                            ) : (
                                watchedSubMethod === 'credit_card' ? 'Pay with Card' : 'Submit for Verification'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </div>
        </DialogContent>
    </Dialog>

    {/* Free Plan Confirmation Dialog */}
    <Dialog open={isFreePlanConfirmOpen} onOpenChange={setIsFreePlanConfirmOpen}>
        <DialogContent className="rounded-3xl border-2">
            <DialogHeader>
                <div className="flex items-center gap-3 text-amber-500 mb-4 bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20">
                    <AlertTriangle className="h-8 w-8 shrink-0" />
                    <div>
                        <DialogTitle className="text-xl font-bold">Confirm Plan Change</DialogTitle>
                        <p className="text-xs font-medium">Downgrading to Free Plan</p>
                    </div>
                </div>
                <DialogDescription className="text-foreground text-base leading-relaxed">
                    আপনি কি নিশ্চিত যে আপনি <span className="font-bold text-primary">Free</span> প্ল্যানে ফিরে যেতে চান? 
                    <br/><br/>
                    এর ফলে আপনার স্টোরের কিছু প্রিমিয়াম ফিচার (যেমন: <span className="font-bold">AI Assistant, SMS Notifications, Custom Domain</span>) বন্ধ হয়ে যাবে।
                </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-8 gap-3 sm:gap-0">
                <Button variant="outline" onClick={() => setIsFreePlanConfirmOpen(false)} disabled={isSubmitting} className="rounded-xl h-11">বাতিল করুন</Button>
                <Button onClick={handleFreePlanSwitch} disabled={isSubmitting} className="rounded-xl h-11 px-8 font-bold shadow-lg">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    হ্যাঁ, পরিবর্তন করুন
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
