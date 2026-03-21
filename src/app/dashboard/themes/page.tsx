
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { StoreTheme } from '@/types';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, X, AlertTriangle, ExternalLink, Palette, CheckCircle2, Layout, Smartphone, Monitor, ShoppingBag, List, Footprints } from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUploader from '@/components/image-uploader';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

const themeSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    subtitle: z.string().optional().or(z.literal('')),
    preview_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
    navbar_design: z.string().default('v1'),
    hero_design: z.string().default('v1'),
    category_design: z.string().default('v1'),
    section_design: z.string().default('v1'),
    card_design: z.string().default('v1'),
    product_page_design: z.string().default('v1'),
    sidebar_design: z.string().default('v1'),
    footer_design: z.string().default('v1'),
    is_active: z.boolean().default(true),
    is_default: z.boolean().default(false),
});

type ThemeFormData = z.infer<typeof themeSchema>;

const DESIGN_OPTIONS = [
    { value: 'v1', label: 'Classic (v1)' },
    { value: 'v2', label: 'Modern (v2)' },
    { value: 'v3', label: 'Premium (v3)' },
    { value: 'v4', label: 'Elite (v4)' },
];

export default function SaasThemesManagerPage() {
    const { user } = useAuth();
    const { themes, setThemes } = useSaasStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(!themes.length);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<StoreTheme | null>(null);

    const form = useForm<ThemeFormData>({
        resolver: zodResolver(themeSchema),
        defaultValues: { title: '', subtitle: '', preview_link: '', image_url: '', navbar_design: 'v1', hero_design: 'v1', category_design: 'v1', section_design: 'v1', card_design: 'v1', product_page_design: 'v1', sidebar_design: 'v1', footer_design: 'v1', is_active: true, is_default: false },
    });

    const fetchThemes = useCallback(async (force = false) => {
        const store = useSaasStore.getState();
        const isFresh = Date.now() - store.lastFetched.themes < 3600000;
        if (!force && store.themes.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/saas/fetch-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity: 'themes' }),
            });
            const result = await response.json();
            if (response.ok) {
                setThemes(result.data as StoreTheme[]);
            } else {
                throw new Error(result.error || 'Failed to fetch themes');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [setThemes, toast]);

    useEffect(() => {
        if (user) fetchThemes();
    }, [fetchThemes, user]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedTheme) {
                form.reset({ 
                    title: selectedTheme.title, 
                    subtitle: selectedTheme.subtitle || '',
                    preview_link: selectedTheme.preview_link || '',
                    image_url: selectedTheme.image_url || '',
                    navbar_design: selectedTheme.navbar_design || 'v1',
                    hero_design: selectedTheme.hero_design || 'v1',
                    category_design: selectedTheme.category_design || 'v1',
                    section_design: selectedTheme.section_design || 'v1',
                    card_design: selectedTheme.card_design || 'v1',
                    product_page_design: selectedTheme.product_page_design || 'v1',
                    sidebar_design: selectedTheme.sidebar_design || 'v1',
                    footer_design: selectedTheme.footer_design || 'v1',
                    is_active: selectedTheme.is_active,
                    is_default: selectedTheme.is_default
                });
            } else {
                form.reset({ title: '', subtitle: '', preview_link: '', image_url: '', navbar_design: 'v1', hero_design: 'v1', category_design: 'v1', section_design: 'v1', card_design: 'v1', product_page_design: 'v1', sidebar_design: 'v1', footer_design: 'v1', is_active: true, is_default: false });
            }
        }
    }, [isFormOpen, selectedTheme, form]);

    const onSubmit = async (data: ThemeFormData) => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/saas/themes/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, id: selectedTheme?.id }),
            });

            if (response.ok) {
                toast({ title: selectedTheme ? 'Theme Updated' : 'Theme Created' });
                await fetchThemes(true);
                setIsFormOpen(false);
                setSelectedTheme(null);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to save theme');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTheme) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/saas/themes/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedTheme.id }),
            });

            if (response.ok) {
                toast({ title: 'Theme Deleted' });
                await fetchThemes(true);
                setIsDeleteAlertOpen(false);
                setSelectedTheme(null);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete theme');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading && themes.length === 0) {
        return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                        <Palette className="h-6 w-6 text-primary" /> Store Themes Manager
                    </h1>
                    <p className="text-muted-foreground text-sm">Create and manage frontend templates for user stores.</p>
                </div>
                <Button onClick={() => { setSelectedTheme(null); setIsFormOpen(true); }} className="rounded-full shadow-lg">
                    <Plus className="mr-2 h-4 w-4" /> Add New Theme
                </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {themes.map((theme) => (
                    <Card key={theme.id} className={cn("overflow-hidden border-2 transition-all group relative flex flex-col", theme.is_active ? "border-border shadow-sm" : "opacity-60 grayscale border-dashed")}>
                        <div className="relative aspect-video bg-muted border-b overflow-hidden">
                            {theme.image_url ? (
                                <Image 
                                    src={theme.image_url} 
                                    alt={theme.title} 
                                    fill 
                                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground"><Palette className="h-10 w-10" /></div>
                            )}
                            
                            <div className="absolute top-3 right-3 flex flex-col gap-2">
                                {theme.is_default && (
                                    <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] tracking-widest px-2 py-0.5 shadow-lg">
                                        <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Default
                                    </Badge>
                                )}
                                {!theme.is_active && (
                                    <Badge variant="destructive" className="font-black uppercase text-[8px] tracking-widest px-2 py-0.5">Inactive</Badge>
                                )}
                            </div>
                        </div>
                        <CardHeader className="p-5">
                            <CardTitle className="text-lg">{theme.title}</CardTitle>
                            <CardDescription className="text-xs line-clamp-2">
                                {theme.subtitle || 'No description provided.'}
                            </CardDescription>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                <Badge variant="secondary" className="text-[8px] h-4 uppercase">Nav: {theme.navbar_design}</Badge>
                                <Badge variant="secondary" className="text-[8px] h-4 uppercase">Card: {theme.card_design}</Badge>
                                <Badge variant="secondary" className="text-[8px] h-4 uppercase">P-Page: {theme.product_page_design}</Badge>
                            </div>
                        </CardHeader>
                        <CardFooter className="p-5 pt-0 gap-2 border-t mt-auto">
                            <div className="flex w-full justify-between items-center pt-4">
                                <div className="flex gap-1">
                                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => { setSelectedTheme(theme); setIsFormOpen(true); }}>
                                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedTheme(theme); setIsDeleteAlertOpen(true); }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                {theme.preview_link && (
                                    <Button variant="link" size="sm" className="h-8 text-xs p-0 gap-1.5" asChild>
                                        <a href={theme.preview_link} target="_blank" rel="noreferrer">Demo <ExternalLink className="h-3 w-3" /></a>
                                    </Button>
                                )}
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsFormOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center shrink-0 bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl"><Palette className="h-5 w-5 text-primary" /></div>
                                <h2 className="text-lg sm:text-xl font-bold">{selectedTheme ? 'Edit Theme' : 'Create New Theme'}</h2>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <ScrollArea className="flex-grow">
                            <div className="p-6">
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                        <div className="space-y-4">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                <Layout className="h-3 w-3" /> Basic Info
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel className="font-bold text-xs">Theme Title</FormLabel><FormControl><Input placeholder="e.g. Premium Organics" {...field} className="h-11 rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="preview_link" render={({ field }) => (<FormItem><FormLabel className="font-bold text-xs">Live Preview URL</FormLabel><FormControl><Input placeholder="https://demo.ihut.shop" {...field} className="h-11 rounded-xl font-mono text-xs" /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            <FormField control={form.control} name="subtitle" render={({ field }) => (<FormItem><FormLabel className="font-bold text-xs">Description</FormLabel><FormControl><Textarea placeholder="..." {...field} rows={2} className="rounded-xl resize-none" /></FormControl></FormItem>)} />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                <Palette className="h-3 w-3" /> Design Components (Homepage)
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <FormField control={form.control} name="navbar_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs flex items-center gap-2"><Layout className="h-3 w-3"/> Navbar</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">{DESIGN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="hero_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs flex items-center gap-2"><Monitor className="h-3 w-3"/> Hero Section</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">{DESIGN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="category_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs flex items-center gap-2"><List className="h-3 w-3"/> Category Display</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">{DESIGN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="section_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs flex items-center gap-2"><Layout className="h-3 w-3"/> Section Container</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">{DESIGN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                                                <ShoppingBag className="h-3 w-3" /> Core Elements
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <FormField control={form.control} name="card_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs">Product Card Design</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">
                                                                <SelectItem value="v1">Classic (v1)</SelectItem>
                                                                <SelectItem value="v2">Premium (v2)</SelectItem>
                                                                <SelectItem value="v3">Minimal Shadow (v3)</SelectItem>
                                                                <SelectItem value="v4">Overlay Actions (v4)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="product_page_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs">Single Product View</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">{DESIGN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="sidebar_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs">Sidebar Categories</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">{DESIGN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name="footer_design" render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="font-bold text-xs flex items-center gap-2"><Footprints className="h-3 w-3"/> Footer Design</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value}>
                                                            <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                                                            <SelectContent className="z-[110]">{DESIGN_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )} />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4 pt-4 border-t">
                                            <FormField control={form.control} name="image_url" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="font-bold text-xs">Cover Preview Image</FormLabel>
                                                    <div className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border-2 border-dashed bg-muted/30">
                                                        <div className="relative h-24 w-full sm:w-40 rounded-lg border bg-muted flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                                            {field.value ? <Image src={field.value} alt="Preview" fill className="object-cover" /> : <Palette className="h-8 w-8 text-muted-foreground/30" />}
                                                        </div>
                                                        <div className="flex-grow w-full space-y-2">
                                                            <FormControl><Input placeholder="Paste Image URL" {...field} className="h-9 text-xs font-mono" /></FormControl>
                                                            <ImageUploader onUpload={(res) => form.setValue('image_url', res.info.secure_url)} label="Upload Screenshot" />
                                                        </div>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                            <FormField control={form.control} name="is_active" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                                                    <FormLabel className="font-bold text-xs">Publicly Active</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="is_default" render={({ field }) => (
                                                <FormItem className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                                                    <FormLabel className="font-bold text-xs">Default Theme</FormLabel>
                                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                    </form>
                                </Form>
                            </div>
                        </ScrollArea>
                        <div className="p-6 border-t flex flex-col sm:flex-row justify-end gap-3 shrink-0 bg-muted/30 pb-10 sm:pb-6">
                            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="rounded-xl px-6 order-2 sm:order-1 h-12">Cancel</Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="rounded-xl px-10 font-bold shadow-lg shadow-primary/20 order-1 sm:order-2 h-12">
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save Design Config</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 text-destructive mb-2">
                            <div className="p-2 bg-destructive/10 rounded-full"><Trash2 className="h-6 w-6" /></div>
                            <AlertDialogTitle className="text-xl font-black">Delete Theme?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            Are you sure you want to permanently remove <strong>"{selectedTheme?.title}"</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }), "rounded-xl")}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Permanently"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
