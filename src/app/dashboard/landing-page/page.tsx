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
import { Layout, Palette, Image as ImageIcon, Loader2, Sparkles, X, Globe, Facebook, Twitter } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ImageUploader from '@/components/image-uploader';
import Image from 'next/image';
import { useAuth } from '@/stores/auth';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const landingPageSchema = z.object({
  hero_title: z.string().min(1, "Hero title is required"),
  hero_title_en: z.string().optional(),
  hero_description: z.string().min(1, "Hero description is required"),
  hero_description_en: z.string().optional(),
  hero_image_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  cta_title: z.string().min(1, "CTA title is required"),
  cta_title_en: z.string().optional(),
  cta_description: z.string().min(1, "CTA description is required"),
  cta_description_en: z.string().optional(),
  cta_bg_color: z.string().min(1, "CTA background color is required"),
  platform_name: z.string().min(1, "Platform name is required"),
  platform_name_en: z.string().optional(),
  logo_url: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  platform_description: z.string().optional(),
  platform_description_en: z.string().optional(),
  social_facebook: z.string().url().optional().or(z.literal('')),
  social_twitter: z.string().url().optional().or(z.literal('')),
  social_tiktok: z.string().url().optional().or(z.literal('')),
});

type LandingPageFormData = z.infer<typeof landingPageSchema>;

const defaultColorPalette = [
    { name: 'Primary', color: 'hsl(var(--primary))' },
    { name: 'Card', color: 'hsl(var(--card))' },
    { name: 'Muted', color: 'hsl(var(--muted))' },
    { name: 'Navy', color: '#172554' },
    { name: 'Green', color: '#064e3b' },
    { name: 'Red', color: '#7f1d1d' },
    { name: 'Amber', color: '#854d0e' },
    { name: 'Indigo', color: '#1e1b4b' },
    { name: 'Slate', color: '#334155' },
];

export default function LandingPageManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LandingPageFormData>({
    resolver: zodResolver(landingPageSchema),
    defaultValues: {
      hero_title: '', hero_title_en: '',
      hero_description: '', hero_description_en: '',
      hero_image_url: '',
      cta_title: '', cta_title_en: '',
      cta_description: '', cta_description_en: '',
      cta_bg_color: 'hsl(var(--primary))',
      platform_name: '', platform_name_en: '',
      logo_url: '',
      platform_description: '', platform_description_en: '',
      social_facebook: '', social_twitter: '', social_tiktok: '',
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
            const d = result.data;
            form.reset({
                hero_title: d.hero_title || '',
                hero_title_en: d.hero_title_en || '',
                hero_description: d.hero_description || '',
                hero_description_en: d.hero_description_en || '',
                hero_image_url: d.hero_image_url || '',
                cta_title: d.cta_title || '',
                cta_title_en: d.cta_title_en || '',
                cta_description: d.cta_description || '',
                cta_description_en: d.cta_description_en || '',
                cta_bg_color: d.cta_bg_color || 'hsl(var(--primary))',
                platform_name: d.platform_name || '',
                platform_name_en: d.platform_name_en || '',
                logo_url: d.logo_url || '',
                platform_description: d.platform_description || '',
                platform_description_en: d.platform_description_en || '',
                social_facebook: d.social_facebook || '',
                social_twitter: d.social_twitter || '',
                social_tiktok: d.social_tiktok || '',
            });
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [form, toast]);

  useEffect(() => {
    if (user) fetchSettings();
  }, [fetchSettings, user]);

  const onSubmit = async (values: LandingPageFormData) => {
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/saas/settings/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        if (response.ok) {
            toast({ title: 'Landing Page updated successfully!' });
            await fetchSettings();
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Landing Page Manager</h1>
          <p className="text-muted-foreground">Customize the content and look of your platform's public website.</p>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-8">
          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="hero" className="py-2.5">Hero Section</TabsTrigger>
              <TabsTrigger value="cta" className="py-2.5">CTA Section</TabsTrigger>
              <TabsTrigger value="header" className="py-2.5">Header & Logo</TabsTrigger>
              <TabsTrigger value="footer" className="py-2.5">Footer & Socials</TabsTrigger>
            </TabsList>

            <TabsContent value="hero" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Hero Content</CardTitle>
                  <CardDescription>Main title and description at the top of the landing page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="bn">
                    <TabsList className="grid w-32 grid-cols-2 mb-4">
                      <TabsTrigger value="bn">BN</TabsTrigger>
                      <TabsTrigger value="en">EN</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bn" className="space-y-6">
                      <FormField control={form.control} name="hero_title" render={({ field }) => (<FormItem><FormLabel>Hero Title (BN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="hero_description" render={({ field }) => (<FormItem><FormLabel>Hero Description (BN)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                    <TabsContent value="en" className="space-y-6">
                      <FormField control={form.control} name="hero_title_en" render={({ field }) => (<FormItem><FormLabel>Hero Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="hero_description_en" render={({ field }) => (<FormItem><FormLabel>Hero Description (EN)</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                  </Tabs>
                  
                  <FormField
                    control={form.control}
                    name="hero_image_url"
                    render={({ field: imgField }) => (
                      <FormItem>
                        <FormLabel>Hero Image (Background/Mockup)</FormLabel>
                        <div className="flex flex-col sm:flex-row items-start gap-4">
                            <div className="relative h-32 w-full sm:w-56 rounded-lg border bg-muted overflow-hidden shrink-0">
                                {imgField.value ? <Image src={imgField.value} alt="Hero Preview" fill className="object-cover" /> : <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">Preview</div>}
                            </div>
                            <div className="flex-grow w-full space-y-2">
                                <FormControl><Input placeholder="Image URL" {...imgField} /></FormControl>
                                <ImageUploader onUpload={(res) => form.setValue('hero_image_url', res.info.secure_url, { shouldValidate: true })} label="Upload New" />
                            </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cta" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> CTA Section</CardTitle>
                  <CardDescription>Customize the call-to-action section near the bottom.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="bn">
                    <TabsList className="grid w-32 grid-cols-2 mb-4">
                      <TabsTrigger value="bn">BN</TabsTrigger>
                      <TabsTrigger value="en">EN</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bn" className="space-y-6">
                      <FormField control={form.control} name="cta_title" render={({ field }) => (<FormItem><FormLabel>Section Title (BN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="cta_description" render={({ field }) => (<FormItem><FormLabel>Description Text (BN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                    <TabsContent value="en" className="space-y-6">
                      <FormField control={form.control} name="cta_title_en" render={({ field }) => (<FormItem><FormLabel>Section Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <FormField control={form.control} name="cta_description_en" render={({ field }) => (<FormItem><FormLabel>Description Text (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                  </Tabs>

                  <FormField
                    control={form.control}
                    name="cta_bg_color"
                    render={({ field: ctaColorField }) => (
                      <FormItem>
                        <FormLabel>Background Color</FormLabel>
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-full sm:w-40 rounded-xl border-2 shadow-inner flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-white drop-shadow-md" style={{ backgroundColor: ctaColorField.value }}>Preview</div>
                            <div className="flex-grow space-y-2">
                                <div className="flex items-center gap-2">
                                    <FormControl><Input placeholder="Hex or HSL" {...ctaColorField} /></FormControl>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0"><Palette className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64">
                                            <div className="grid grid-cols-3 gap-2 p-2">
                                                {defaultColorPalette.map(p => (<button key={p.name} type="button" onClick={() => form.setValue('cta_bg_color', p.color)} className="h-10 rounded border-2 border-border/50 hover:scale-105 transition-transform" style={{ backgroundColor: p.color }} title={p.name} />))}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="header" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Header & Logo</CardTitle>
                  <CardDescription>Manage your platform's name and branding in the navigation bar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="bn">
                    <TabsList className="grid w-32 grid-cols-2 mb-4">
                      <TabsTrigger value="bn">BN</TabsTrigger>
                      <TabsTrigger value="en">EN</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bn">
                      <FormField control={form.control} name="platform_name" render={({ field }) => (<FormItem><FormLabel>Platform Name (BN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                    <TabsContent value="en">
                      <FormField control={form.control} name="platform_name_en" render={({ field }) => (<FormItem><FormLabel>Platform Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                  </Tabs>
                  
                  <FormField
                    control={form.control}
                    name="logo_url"
                    render={({ field: logoField }) => (
                      <FormItem>
                        <FormLabel>Logo Image URL</FormLabel>
                        <div className="flex items-center gap-4">
                            <div className="relative h-12 w-12 rounded-lg border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                                {logoField.value ? <Image src={logoField.value} alt="Logo" fill className="object-contain p-1" /> : <div className="text-[10px]">Logo</div>}
                            </div>
                            <FormControl><Input placeholder="URL" {...logoField} /></FormControl>
                            <ImageUploader onUpload={(res) => form.setValue('logo_url', res.info.secure_url, { shouldValidate: true })} label="Upload" />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="footer" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5 text-primary" /> Footer & Socials</CardTitle>
                  <CardDescription>Content for the very bottom of your site.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="bn">
                    <TabsList className="grid w-32 grid-cols-2 mb-4">
                      <TabsTrigger value="bn">BN</TabsTrigger>
                      <TabsTrigger value="en">EN</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bn">
                      <FormField control={form.control} name="platform_description" render={({ field }) => (<FormItem><FormLabel>Footer About (BN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                    <TabsContent value="en">
                      <FormField control={form.control} name="platform_description_en" render={({ field }) => (<FormItem><FormLabel>Footer About (EN)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </TabsContent>
                  </Tabs>
                  
                  <Separator />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Social Media Links</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="social_facebook" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Facebook className="h-4 w-4" /> Facebook</FormLabel><FormControl><Input placeholder="URL" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="social_twitter" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><Twitter className="h-4 w-4" /> Twitter / X</FormLabel><FormControl><Input placeholder="URL" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}