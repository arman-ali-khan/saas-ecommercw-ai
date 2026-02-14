
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
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { Loader2, Palette, Copy, Sparkles, CheckCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import IconPicker from '@/components/icon-picker';
import ImageUploader from '@/components/image-uploader';
import Image from 'next/image';
import DynamicIcon from '@/components/dynamic-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { type SeoRequest, type Plan } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';


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
  acceptedBankingMethods: z.array(z.string()).default([]),
});

const brandingSchema = z.object({
    logo_type: z.enum(['icon', 'image']).default('icon'),
    logo_icon: z.string().default('Leaf'),
    logo_image_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    favicon_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
    social_share_image_url: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

const appearanceSchema = z.object({
  theme_background: z.string().optional(),
  theme_foreground: z.string().optional(),
  theme_primary: z.string().optional(),
  theme_secondary: z.string().optional(),
  theme_accent: z.string().optional(),
  theme_card: z.string().optional(),
  font_primary: z.string().optional(),
  font_secondary: z.string().optional(),
});

const subscriptionChangeSchema = z.object({
  transactionId: z.string().min(5, "A valid transaction ID is required."),
});
type SubscriptionChangeFormData = z.infer<typeof subscriptionChangeSchema>;


const fontOptions = {
    primary: ['Hind Siliguri', 'Noto Sans Bengali', 'Lato', 'Roboto', 'Open Sans'],
    secondary: ['Orbitron', 'Montserrat', 'Lato', 'Roboto'],
};

const colorPalettes = [
  {
    name: 'Oceanic Deep',
    colors: ['#EDEDCE', '#629FAD', '#296374', '#0C2C55'],
    mapping: {
      background: '60 44% 87%', foreground: '214 75% 19%', card: '60 44% 87%',
      primary: '196 48% 30%', secondary: '193 31% 53%', accent: '193 31% 53%',
    },
  },
  {
    name: 'Aqua Fresh',
    colors: ['#F4F4F4', '#00B7B5', '#018790', '#005461'],
    mapping: {
      background: '0 0% 96%', foreground: '190 100% 19%', card: '0 0% 96%',
      primary: '183 98% 28%', secondary: '179 100% 36%', accent: '179 100% 36%',
    },
  },
  {
    name: 'Royal Amethyst (Dark)',
    colors: ['#4B164C', '#DD88CF', '#F8E7F6', '#F5F5F5'],
    mapping: {
      background: '299 55% 20%', foreground: '0 0% 96%', card: '299 55% 20%',
      primary: '317 56% 70%', secondary: '310 56% 95%', accent: '317 56% 70%',
    },
  },
  {
    name: 'Lavender Mist',
    colors: ['#D6F4ED', '#87BAC3', '#53629E', '#473472'],
    mapping: {
      background: '165 59% 90%', foreground: '256 38% 32%', card: '165 59% 90%',
      primary: '228 32% 47%', secondary: '190 28% 64%', accent: '190 28% 64%',
    },
  },
  {
    name: 'Spring Meadow',
    colors: ['#EBFFD8', '#C4E1E6', '#A4CCD9', '#8DBCC7'],
    mapping: {
      background: '90 100% 92%', foreground: '222.2 84% 4.9%', card: '90 100% 92%',
      primary: '192 32% 70%', secondary: '199 38% 78%', accent: '190 41% 84%',
    },
  },
  {
    name: 'Sunset Grove',
    colors: ['#FFFFFF', '#FFD150', '#FF9760', '#F26076', '#458B73'],
    mapping: {
      background: '0 0% 100%', foreground: '159 34% 40%', card: '0 0% 100%',
      primary: '352 86% 66%', secondary: '22 100% 69%', accent: '44 100% 66%',
    },
  },
  {
    name: 'Majestic Twilight (Dark)',
    colors: ['#0E2148', '#483AA0', '#7965C1', '#E3D095'],
    mapping: {
      background: '220 71% 17%', foreground: '47 57% 74%', card: '220 71% 17%',
      primary: '253 43% 58%', secondary: '247 48% 52%', accent: '247 48% 52%',
    },
  },
  {
    name: 'Minimalist Stone',
    colors: ['#EEEEEE', '#DDDDDD', '#F79B72', '#2A4759'],
    mapping: {
      background: '0 0% 93%', foreground: '205 35% 26%', card: '0 0% 87%',
      primary: '20 90% 71%', secondary: '205 35% 26%', accent: '20 90% 71%',
    },
  },
  {
    name: 'Neon Sunset (Dark)',
    colors: ['#3D365C', '#7C4585', '#C95792', '#F8B55F'],
    mapping: {
      background: '250 28% 29%', foreground: '37 92% 67%', card: '250 28% 29%',
      primary: '329 55% 57%', secondary: '291 32% 40%', accent: '291 32% 40%',
    },
  },
];


const ColorPaletteSelector = ({ onSelectPalette }: { onSelectPalette: (mapping: any) => void }) => {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                    <Palette className="mr-2 h-4 w-4 shrink-0" />
                    <span className="flex-grow">Select a Color Palette</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                <DropdownMenuLabel>Pre-defined Palettes</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {colorPalettes.map((palette) => (
                    <DropdownMenuItem key={palette.name} onSelect={() => onSelectPalette(palette.mapping)} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                            <span>{palette.name}</span>
                            <div className="flex items-center gap-1">
                                {palette.colors.map((color) => (
                                    <div key={color} className="h-4 w-4 rounded-full border" style={{ backgroundColor: color }} />
                                ))}
                            </div>
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};


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
    defaultValues: { mobileBankingEnabled: false, mobileBankingNumber: '', acceptedBankingMethods: []},
  });

  const brandingForm = useForm<z.infer<typeof brandingSchema>>({
    resolver: zodResolver(brandingSchema),
    defaultValues: { logo_type: 'icon', logo_icon: 'Leaf', logo_image_url: '', favicon_url: '', social_share_image_url: '' },
  });

  const appearanceForm = useForm<z.infer<typeof appearanceSchema>>({
    resolver: zodResolver(appearanceSchema),
    defaultValues: {},
  });
  
  const subscriptionChangeForm = useForm<SubscriptionChangeFormData>({
    resolver: zodResolver(subscriptionChangeSchema),
    defaultValues: { transactionId: '' },
  });

  useEffect(() => {
    if (user) {
        setIsLoading(true);

        const protocol = window.location.protocol;
        const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'schoolbd.top';
        setSitemapUrl(`${protocol}//${user.domain}.${baseDomain}/sitemap.xml`);
        setRobotsUrl(`${protocol}//${user.domain}.${baseDomain}/robots.txt`);

        const fetchSettingsAndRequests = async () => {
            const settingsPromise = supabase
                .from('store_settings')
                .select('*')
                .eq('site_id', user.id)
                .single();
            
            const seoRequestPromise = supabase
                .from('seo_requests')
                .select('*')
                .eq('site_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            const plansPromise = supabase.from('plans').select('*').order('price', { ascending: true });

            const [
                { data, error }, 
                { data: seoRequestData, error: seoRequestError },
                { data: plansData, error: plansError }
            ] = await Promise.all([settingsPromise, seoRequestPromise, plansPromise]);

            if (error && error.code !== 'PGRST116') {
                toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
            }

            if (plansData) {
                setPlans(plansData);
            }
            setIsLoadingPlans(false);

            form.reset({
                siteName: user.siteName || '',
                siteDescription: user.siteDescription || '',
            });

            if (data) {
                seoForm.reset({
                    seoTitle: data.seo_title || '',
                    seoDescription: data.seo_description || '',
                    seoKeywords: data.seo_keywords || '',
                });

                paymentForm.reset({
                    mobileBankingEnabled: data.mobile_banking_enabled ?? false,
                    mobileBankingNumber: data.mobile_banking_number || '',
                    acceptedBankingMethods: data.accepted_banking_methods || [],
                });

                brandingForm.reset({
                    logo_type: data.logo_type || 'icon',
                    logo_icon: data.logo_icon || 'Leaf',
                    logo_image_url: data.logo_image_url || '',
                    favicon_url: data.favicon_url || '',
                    social_share_image_url: data.social_share_image_url || '',
                });

                appearanceForm.reset({
                    theme_background: data.theme_background || '',
                    theme_foreground: data.theme_foreground || '',
                    theme_primary: data.theme_primary || '',
                    theme_secondary: data.theme_secondary || '',
                    theme_accent: data.theme_accent || '',
                    theme_card: data.theme_card || '',
                    font_primary: data.font_primary || 'Hind Siliguri',
                    font_secondary: data.font_secondary || 'Orbitron',
                });
            }

            if (seoRequestData) {
                setSeoRequest(seoRequestData as SeoRequest);
            }
            
            setIsSeoRequestLoading(false);
            setIsLoading(false);
        };
        fetchSettingsAndRequests();
    }
  }, [user, form, seoForm, paymentForm, brandingForm, appearanceForm, toast]);

  async function onGeneralSubmit(values: z.infer<typeof settingsSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            site_name: values.siteName,
            site_description: values.siteDescription,
        })
        .eq('id', user.id);
    
    setIsSubmitting(false);

    if (profileError) {
        toast({ variant: 'destructive', title: 'Error updating site info', description: profileError.message });
    } else {
        toast({ title: 'General settings saved!' });
        await refreshUser();
    }
  }

  async function onSeoSubmit(values: z.infer<typeof seoSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('store_settings').upsert({
        site_id: user.id,
        seo_title: values.seoTitle,
        seo_description: values.seoDescription,
        seo_keywords: values.seoKeywords,
    });
    setIsSubmitting(false);
    if(error) {
        toast({ variant: 'destructive', title: 'Error saving SEO settings', description: error.message });
    } else {
        toast({ title: 'SEO settings saved!' });
    }
  }

  async function onPaymentSubmit(values: z.infer<typeof paymentSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('store_settings').upsert({
        site_id: user.id,
        mobile_banking_enabled: values.mobileBankingEnabled,
        mobile_banking_number: values.mobileBankingNumber,
        accepted_banking_methods: values.acceptedBankingMethods,
    });
    setIsSubmitting(false);
    if (error) {
        toast({ variant: 'destructive', title: 'Error saving payment settings', description: error.message });
    } else {
        toast({ title: 'Payment settings saved!' });
    }
  }

  async function onBrandingSubmit(values: z.infer<typeof brandingSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('store_settings').upsert({
        site_id: user.id,
        logo_type: values.logo_type,
        logo_icon: values.logo_icon,
        logo_image_url: values.logo_image_url,
        favicon_url: values.favicon_url,
        social_share_image_url: values.social_share_image_url,
    });
    setIsSubmitting(false);
    if (error) {
        toast({ variant: 'destructive', title: 'Error saving branding settings', description: error.message });
    } else {
        toast({ title: 'Branding settings saved!' });
    }
  }
  
  async function onAppearanceSubmit(values: z.infer<typeof appearanceSchema>) {
    if (!user) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('store_settings').upsert({
        site_id: user.id,
        ...values
    });
    setIsSubmitting(false);
    if (error) {
        toast({ variant: 'destructive', title: 'Error saving appearance settings', description: error.message });
    } else {
        toast({ title: 'Appearance settings saved!' });
    }
  }

  async function handleSeoRequest() {
    if (!user) return;
    setIsSubmitting(true);
    
    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', user.id);

    if (countError) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not get product count.' });
        setIsSubmitting(false);
        return;
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
    setIsSubmitting(false);

    if(error) {
        toast({ variant: 'destructive', title: 'Error creating request', description: error.message });
    } else {
        toast({ title: 'SEO request submitted!', description: 'You will be notified when the review is complete.' });
        const { data } = await supabase.from('seo_requests').select('*').eq('site_id', user.id).order('created_at', { ascending: false }).limit(1).single();
        if (data) setSeoRequest(data as SeoRequest);
    }
  }

    const handleSelectPalette = (mapping: any) => {
        Object.keys(mapping).forEach(key => {
            (appearanceForm.setValue as any)(`theme_${key}`, mapping[key]);
        });
        toast({ title: 'Palette applied!', description: 'Click "Save" to make the changes permanent.' });
    };

    const handlePlanChangeClick = (plan: Plan) => {
        if (!user || plan.id === user.subscriptionPlan) return;
        setPlanToChange(plan);
        setIsChangePlanDialogOpen(true);
    };

    const onSubscriptionChangeSubmit = async (data: SubscriptionChangeFormData) => {
        if (!user || !planToChange) return;

        setIsSubmitting(true);
        try {
            const { error: paymentError } = await supabase.from('subscription_payments').insert({
                user_id: user.id,
                plan_id: planToChange.id,
                amount: planToChange.price,
                payment_method: 'mobile_banking',
                transaction_id: data.transactionId,
                status: 'pending_verification',
            });

            if (paymentError) throw paymentError;

            const { error: profileError } = await supabase.from('profiles').update({
                subscription_status: 'pending_verification'
            }).eq('id', user.id);

            if (profileError) throw profileError;
            
            toast({ title: 'Upgrade Request Submitted', description: 'Your request is under review. You will be notified upon approval.' });
            await refreshUser();
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="general">সাধারণ</TabsTrigger>
              <TabsTrigger value="branding">ব্র্যান্ডিং</TabsTrigger>
              <TabsTrigger value="appearance">সাজসজ্জা</TabsTrigger>
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
                                    <div className="flex items-start gap-4">
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
                                <div className="flex items-start gap-4">
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
                                <div className="flex items-start gap-4">
                                    <div className="relative h-24 w-48 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">
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
             <TabsContent value="appearance" className="mt-6">
                 <Form {...appearanceForm}>
                    <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)} className="space-y-8">
                         <Card>
                            <CardHeader>
                                <CardTitle>Color Palette</CardTitle>
                                <CardDescription>Quickly set a color scheme for your store. This will override the individual color fields below.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ColorPaletteSelector onSelectPalette={handleSelectPalette} />
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Theme Colors</CardTitle><CardDescription>Customize the main colors of your storefront. Use HSL values without the 'hsl()' wrapper (e.g., '224 71% 4%').</CardDescription></CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-6">
                                {(['background', 'foreground', 'primary', 'secondary', 'accent', 'card'] as const).map(color => (
                                    <FormField
                                        key={color}
                                        control={appearanceForm.control}
                                        name={`theme_${color}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="capitalize">{color}</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl><Input placeholder='e.g., 224 71% 4%' {...field} /></FormControl>
                                                </div>
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Fonts</CardTitle><CardDescription>Choose the primary and headline fonts for your site.</CardDescription></CardHeader>
                            <CardContent className="grid sm:grid-cols-2 gap-6">
                                <FormField
                                    control={appearanceForm.control}
                                    name="font_primary"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Primary Font (Body)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger></FormControl>
                                            <SelectContent>{fontOptions.primary.map(font => <SelectItem key={font} value={font} style={{fontFamily: font}}>{font}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={appearanceForm.control}
                                    name="font_secondary"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Secondary Font (Headlines)</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger></FormControl>
                                            <SelectContent>{fontOptions.secondary.map(font => <SelectItem key={font} value={font} style={{fontFamily: font}}>{font}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                        
                        <div className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Appearance Settings সংরক্ষণ করুন
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
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle>Your Current Plan: {currentPlan.name}</CardTitle>
                                    <CardDescription>{currentPlan.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-4xl font-bold font-headline">
                                        {currentPlan.price === 0 ? 'Free' : `৳${currentPlan.price}`}
                                        <span className="text-sm font-normal text-muted-foreground">{currentPlan.period}</span>
                                    </p>
                                </CardContent>
                            </Card>
                         )}
                         <div className="space-y-4">
                            <h3 className="font-semibold">Available Plans</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {plans.filter(p => p.id !== user?.subscriptionPlan).map(plan => (
                                    <Card key={plan.id}>
                                        <CardHeader>
                                            <CardTitle>{plan.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold font-headline">
                                                {plan.price === 0 ? 'Free' : `৳${plan.price}`}
                                                <span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                                            </p>
                                            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {feature}</li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter>
                                            <Button className="w-full" onClick={() => handlePlanChangeClick(plan)} disabled={user?.subscription_status === 'pending_verification'}>
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
    <Dialog open={isChangePlanDialogOpen} onOpenChange={setIsChangePlanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {planToChange?.name}</DialogTitle>
            <DialogDescription>To upgrade your plan, please complete the payment below.</DialogDescription>
          </DialogHeader>
            <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
                <h3 className="font-bold mb-2 text-foreground">Mobile Banking Instructions</h3>
                <ol className="list-decimal list-inside space-y-2">
                    <li>Open your preferred mobile banking app.</li>
                    <li>Select the "Payment" option.</li>
                    <li>Enter the merchant number: <strong>{paymentForm.getValues('mobileBankingNumber') || '...'}</strong></li>
                    <li>Enter the amount: <strong>৳{planToChange?.price.toFixed(2)}</strong></li>
                    <li>Complete the payment and copy the Transaction ID.</li>
                    <li>Paste the Transaction ID in the box below.</li>
                </ol>
            </div>
            <Form {...subscriptionChangeForm}>
            <form onSubmit={subscriptionChangeForm.handleSubmit(onSubscriptionChangeSubmit)} className="space-y-4">
                <FormField
                    control={subscriptionChangeForm.control}
                    name="transactionId"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Transaction ID</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 8N7F6G5H4J" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit for Verification
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
    </>
  );
}

    

    

    
