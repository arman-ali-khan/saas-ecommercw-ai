
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
import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { Loader2, Copy, Sparkles, CheckCircle, Palette, Trash2, Globe, BarChart, CreditCard, ShieldCheck, AlertTriangle, Wallet, ShoppingBag, Smartphone } from 'lucide-react';
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
import { useSearchParams, useRouter } from 'next/navigation';

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
    pwa_logo_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    social_share_image_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

const subscriptionChangeSchema = z.object({
  paymentMethod: z.enum(['credit_card', 'mobile_banking', 'aamarpay']).default('aamarpay'),
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

function SettingsContent() {
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
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

  const activeTab = searchParams.get('tab') || 'general';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.push(`?${params.toString()}`);
  };

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
    defaultValues: { logo_type: 'icon', logo_icon: 'Leaf', logo_image_url: '', favicon_url: '', pwa_logo_url: '', social_share_image_url: '' },
  });
  
  const subscriptionChangeForm = useForm<SubscriptionChangeFormData>({
    resolver: zodResolver(subscriptionChangeSchema),
    defaultValues: { paymentMethod: 'aamarpay', transactionId: '' },
  });

  const watchedSubMethod = subscriptionChangeForm.watch('paymentMethod');

  const fetchSettingsData = useCallback(async () => {
    if (!user) return;
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
                pwa_logo_url: settings.pwa_logo_url || '',
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
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('site_id', user.id);
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
        toast({ title: 'SEO request submitted!' });
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
    if (plan.id === 'free') setIsFreePlanConfirmOpen(true);
    else setIsChangePlanDialogOpen(true);
  };

  const onSubscriptionChangeSubmit = async (data: SubscriptionChangeFormData) => {
    if (!user || !planToChange) return;
    setIsSubmitting(true);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (data.paymentMethod === 'credit_card' || data.paymentMethod === 'aamarpay') {
        const endpoint = data.paymentMethod === 'credit_card' ? '/api/saas/payments/stripe/checkout' : '/api/saas/payments/aamarpay/create';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: planToChange.id,
                    planName: planToChange.name,
                    amount: planToChange.price,
                    siteId: user.id,
                    email: user.email,
                    origin: origin,
                    successUrl: `${origin}/admin/settings?payment=success`,
                    cancelUrl: `${origin}/admin/settings?payment=cancel`,
                }),
            });
            const result = await response.json();
            if (result.url || result.paymentURL) window.location.href = result.url || result.paymentURL;
            else throw new Error(result.error || 'Checkout failed');
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Error', description: e.message });
            setIsSubmitting(false);
        }
        return;
    }
    try {
        const response = await fetch('/api/settings/request-plan-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id, planId: planToChange.id, amount: planToChange.price, transactionId: data.transactionId }),
        });
        if (response.ok) {
            await fetch('/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientType: 'admin', siteId: user.id, message: `New manual payment from "${user.siteName}" (@${user.domain}) for plan: ${planToChange.name}.`, link: '/dashboard/subscriptions' }),
            });
            toast({ title: 'Upgrade Request Submitted' });
            await refreshUser();
        } else throw new Error((await response.json()).error);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
        setIsChangePlanDialogOpen(false);
    }
  };

  const handleFreePlanSwitch = async () => {
    if (!user || !planToChange) return;
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/settings/request-plan-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: user.id, planId: 'free', amount: 0, transactionId: `FREE_SWITCH_${Date.now()}` }),
        });
        if (response.ok) {
            toast({ title: 'Downgrade Request Submitted' });
            await refreshUser();
        } else throw new Error((await response.json()).error);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
        setIsFreePlanConfirmOpen(false);
    }
  }

  const currentPlan = useMemo(() => plans.find(p => p.id === user?.subscriptionPlan), [plans, user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">সাইট সেটিংস</h1>
        <p className="text-muted-foreground">আপনার সাইটের সাধারণ তথ্য, ব্র্যান্ডিং এবং পেমেন্ট বিবরণ পরিচালনা করুন।</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto mb-8">
              <TabsTrigger value="general">সাধারণ</TabsTrigger>
              <TabsTrigger value="branding">ব্র্যান্ডিং</TabsTrigger>
              <TabsTrigger value="seo">এসইও</TabsTrigger>
              <TabsTrigger value="payments">পেমেন্ট</TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="mt-0">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onGeneralSubmit)} className="space-y-8">
                        <FormField control={form.control} name="siteName" render={({ field }) => ( <FormItem><FormLabel>সাইটের নাম</FormLabel><FormControl><Input placeholder="বাংলা ন্যাচারালস" {...field} /></FormControl><FormDescription>এটি আপনার সাইটের শিরোনামে এবং অন্যান্য স্থানে প্রদর্শিত হবে।</FormDescription><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="siteDescription" render={({ field }) => ( <FormItem><FormLabel>সাইটের বিবরণ</FormLabel><FormControl><Textarea placeholder="..." rows={3} {...field} /></FormControl><FormDescription>আপনার সাইটের একটি সংক্ষিপ্ত সারসংক্ষেপ।</FormDescription><FormMessage /></FormItem> )} />
                        <div className="pt-4 border-t"><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}সাধারণ সেটিংস সংরক্ষণ করুন</Button></div>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="branding" className="mt-0">
                <Form {...brandingForm}>
                    <form onSubmit={brandingForm.handleSubmit(onBrandingSubmit)} className="space-y-8">
                         <FormField control={brandingForm.control} name="logo_type" render={({ field }) => ( <FormItem className="space-y-3"><FormLabel>লোগোর ধরন</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4"><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="icon" /></FormControl><FormLabel className="font-normal">আইকন</FormLabel></FormItem><FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="image" /></FormControl><FormLabel className="font-normal">ছবি</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem> )} />
                        {brandingForm.watch('logo_type') === 'icon' ? (
                             <FormField control={brandingForm.control} name="logo_icon" render={({ field }) => ( <FormItem><FormLabel>লোগো আইকন</FormLabel><FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem> )} />
                        ) : (
                            <FormField control={brandingForm.control} name="logo_image_url" render={({ field }) => ( <FormItem><FormLabel>লোগো ছবি</FormLabel><div className="flex flex-col items-start gap-4"><div className="relative h-24 w-24 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">{field.value ? <Image src={field.value} alt="Logo" fill className="object-contain p-2" /> : <div className="text-[10px]">Preview</div>}</div><div className='flex-grow space-y-2 w-full'><FormControl><Input placeholder="https://..." {...field} /></FormControl><ImageUploader onUpload={(res) => brandingForm.setValue('logo_image_url', res.info.secure_url)} label='আপলোড করুন' /></div></div><FormMessage /></FormItem> )} />
                        )}
                        <div className="pt-4 border-t"><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}ব্র্যান্ডিং সেটিংস সংরক্ষণ করুন</Button></div>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="seo" className="mt-0">
                <Form {...seoForm}>
                    <form onSubmit={seoForm.handleSubmit(onSeoSubmit)} className="space-y-8">
                        <FormField control={seoForm.control} name="seoTitle" render={({ field }) => ( <FormItem><FormLabel>এসইও শিরোনাম</FormLabel><FormControl><Input placeholder="..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={seoForm.control} name="seoDescription" render={({ field }) => ( <FormItem><FormLabel>এসইও বিবরণ</FormLabel><FormControl><Textarea placeholder="..." rows={3} {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={seoForm.control} name="seoKeywords" render={({ field }) => ( <FormItem><FormLabel>এসইও কীওয়ার্ড</FormLabel><FormControl><Input placeholder="..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <div className="pt-4 border-t"><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}এসইও সেটিংস সংরক্ষণ করুন</Button></div>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="payments" className="mt-0">
                <Form {...paymentForm}>
                    <form onSubmit={paymentForm.handleSubmit(onPaymentSubmit)} className="space-y-8">
                        <FormField control={paymentForm.control} name="mobileBankingEnabled" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 p-4 bg-muted/10"><div className="space-y-0.5"><FormLabel className="text-base font-bold">মোবাইল ব্যাংকিং সক্ষম করুন</FormLabel><FormDescription>গ্রাহকদের সরাসরি পেমেন্ট করার সুযোগ দিন।</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                        <div className="grid md:grid-cols-2 gap-6">
                            <FormField control={paymentForm.control} name="mobileBankingNumber" render={({ field }) => ( <FormItem><FormLabel>মোবাইল ব্যাংকিং নম্বর</FormLabel><FormControl><Input placeholder="017XXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={paymentForm.control} name="mobileBankingType" render={({ field }) => ( <FormItem><FormLabel>নম্বরের ধরন</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent className="z-[110]"><SelectItem value="personal">Personal</SelectItem><SelectItem value="agent">Agent</SelectItem><SelectItem value="merchant">Merchant</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                        </div>
                        <div className="pt-4 border-t"><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}পেমেন্ট সেটিংস সংরক্ষণ করুন</Button></div>
                    </form>
                </Form>
            </TabsContent>

            <TabsContent value="subscription" className="mt-0">
                <div className="space-y-8">
                    {!isLoadingPlans && currentPlan ? (
                        <>
                            <Card className="bg-primary/5 border-2 border-primary/20 rounded-2xl shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div><CardTitle className="text-xl">আপনার বর্তমান প্ল্যান: {currentPlan.name}</CardTitle><CardDescription>{currentPlan.description}</CardDescription></div>
                                    <Badge className="px-4 py-1 uppercase tracking-widest text-[10px] font-black">{user?.subscription_status}</Badge>
                                </CardHeader>
                                <CardContent><p className="text-4xl font-black text-primary">{currentPlan.price === 0 ? 'Free' : `৳${currentPlan.price}`}<span className="text-sm font-normal text-muted-foreground ml-1">{currentPlan.period}</span></p>{user?.subscription_end_date && (<p className="text-[10px] text-muted-foreground mt-2 font-bold uppercase tracking-widest">Expires on: {new Date(user.subscription_end_date).toLocaleDateString()}</p>)}</CardContent>
                            </Card>
                            <div className="grid md:grid-cols-2 gap-6">
                                {plans.filter(p => p.id !== user?.subscriptionPlan).map(plan => (
                                    <Card key={plan.id} className="flex flex-col border-2 hover:border-primary/30 transition-all rounded-2xl"><CardHeader className="bg-muted/30"><CardTitle>{plan.name}</CardTitle></CardHeader><CardContent className="pt-6 flex-grow"><p className="text-3xl font-black text-primary">{plan.price === 0 ? 'Free' : `৳${plan.price}`}</p><ul className="mt-6 space-y-3 text-sm">{plan.features.map((f, i) => (<li key={i} className="flex items-center gap-2 text-xs"><CheckCircle className="h-3 w-3 text-green-500" /> {f}</li>))}</ul></CardContent><CardFooter className="bg-muted/10 pt-4"><Button className="w-full rounded-xl font-bold" onClick={() => handlePlanChangeClick(plan)} disabled={user?.subscription_status === 'pending_verification'}>{user?.subscription_status === 'pending_verification' ? 'Upgrade Pending' : `Switch to ${plan.name}`}</Button></CardFooter></Card>
                                ))}
                            </div>
                        </>
                    ) : <Skeleton className="h-64 w-full rounded-2xl" />}
                </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}><DialogContent className="max-w-2xl rounded-[2rem] p-0 overflow-hidden border-2 shadow-2xl"><DialogHeader className="bg-primary p-8 text-primary-foreground"><div className="flex items-center gap-3"><div className="p-3 bg-white/20 rounded-2xl"><CreditCard className="h-8 w-8" /></div><div><DialogTitle className="text-2xl font-black">Upgrade Plan</DialogTitle></div></div></DialogHeader><div className="p-8 space-y-8"><Form {...subscriptionChangeForm}><form onSubmit={subscriptionChangeForm.handleSubmit(onSubscriptionChangeSubmit)} className="space-y-8"><FormField control={subscriptionChangeForm.control} name="paymentMethod" render={({ field }) => ( <FormItem><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 sm:grid-cols-3 gap-4"><Label htmlFor="up-pm-aamarpay" className={cn("flex flex-col items-center justify-center rounded-2xl border-2 p-4 cursor-pointer", field.value === 'aamarpay' ? "border-orange-500 bg-orange-500/5" : "border-muted")}><RadioGroupItem value="aamarpay" id="up-pm-aamarpay" className="sr-only" /><ShoppingBag className="h-8 w-8 mb-3" /><p className="font-bold text-xs">Online</p></Label><Label htmlFor="up-pm-stripe" className={cn("flex flex-col items-center justify-center rounded-2xl border-2 p-4 cursor-pointer", field.value === 'credit_card' ? "border-primary bg-primary/5" : "border-muted")}><RadioGroupItem value="credit_card" id="up-pm-stripe" className="sr-only" /><CreditCard className="h-8 w-8 mb-3" /><p className="font-bold text-xs">Cards</p></Label><Label htmlFor="up-pm-mobile" className={cn("flex flex-col items-center justify-center rounded-2xl border-2 p-4 cursor-pointer", field.value === 'mobile_banking' ? "border-primary bg-primary/5" : "border-muted")}><RadioGroupItem value="mobile_banking" id="up-pm-mobile" className="sr-only" /><Wallet className="h-8 w-8 mb-3" /><p className="font-bold text-xs">Manual</p></Label></RadioGroup></FormControl></FormItem> )} />{watchedSubMethod === 'mobile_banking' && ( <div className="space-y-4 p-5 bg-muted/50 rounded-2xl border-2 border-dashed"><FormField control={subscriptionChangeForm.control} name="transactionId" render={({ field }) => ( <FormItem><FormLabel className="font-bold">Transaction ID</FormLabel><FormControl><Input placeholder="8N7F6..." {...field} /></FormControl><FormMessage /></FormItem> )} /></div> )}<DialogFooter><Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : 'Pay & Activate'}</Button></DialogFooter></form></Form></div></DialogContent></Dialog>
    </div>
  );
}

export default function SettingsAdminPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>}>
            <SettingsContent />
        </Suspense>
    );
}
