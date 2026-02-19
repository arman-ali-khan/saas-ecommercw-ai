'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trash2, ChevronDown, Star, PackageCheck, Ban, CalendarIcon, Wand2, RotateCcw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import type { Product, ProductAttribute, Category } from '@/types';
import ImageUploader from '@/components/image-uploader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/rich-text-editor';
import { isBefore, format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { generateProductDescription } from '@/ai/flows/generate-product-description';

const productFormSchema = z.object({
  id: z.string().min(3, 'ID/Slug must be at least 3 characters.').regex(/^[a-z0-9\u0980-\u09FF-]+$/, 'Slug can only contain lowercase letters, numbers, hyphens, and Bengali characters.'),
  name: z.string().min(1, 'Name is required.'),
  price: z.preprocess((a) => parseFloat(String(a)), z.number().positive('Price must be a positive number.')),
  stock: z.preprocess((a) => parseInt(String(a), 10), z.number().min(0, "Stock can't be negative.").default(0)),
  currency: z.string().default('BDT'),
  description: z.string().optional(),
  long_description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  origin: z.string().optional(),
  story: z.string().optional(),
  is_featured: z.boolean().default(false),
  brand: z.array(z.string()).optional(),
  unit: z.array(z.string()).optional(),
  size: z.array(z.string()).optional(),
  color: z.array(z.string()).optional(),
  images: z.array(z.object({ imageUrl: z.string().url('Must be a valid URL.'), imageHint: z.string().optional() })).min(1, 'At least one image is required.'),
  has_flash_deal: z.boolean().default(false),
  flash_deal_price: z.preprocess((val) => (val === '' || val == null ? undefined : parseFloat(String(val))), z.number().positive('Discount price must be a positive number.').optional()),
  flash_deal_range: z.object({ startDate: z.any().optional(), endDate: z.any().optional() }).optional(),
}).superRefine((data, ctx) => {
    if (data.has_flash_deal) {
        if (!data.flash_deal_price || data.flash_deal_price <= 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Discount price is required and must be positive.", path: ['flash_deal_price'] });
        if (!data.flash_deal_range?.startDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Start date is required for the flash deal.", path: ['flash_deal_range', 'startDate'] });
        if (!data.flash_deal_range?.endDate) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date is required for the flash deal.", path: ['flash_deal_range', 'endDate'] });
        if (data.flash_deal_range?.startDate && data.flash_deal_range?.endDate) {
            const start = new Date(data.flash_deal_range.startDate);
            const end = new Date(data.flash_deal_range.endDate);
            if (end <= start) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End date must be after the start date.", path: ['flash_deal_range', 'endDate'] });
        }
        if (data.flash_deal_price && data.price && data.flash_deal_price >= data.price) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Discount price must be less than the regular price.", path: ['flash_deal_price'] });
    }
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ManageProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { attributes, categories, setAttributes, setCategories, dashboard, lastFetched, invalidateEntity } = useAdminStore();

  const productId = params.productId as string;
  const isNew = productId === 'new';
  const draftKey = useMemo(() => user ? `unsaved_product_draft_${user.id}` : null, [user]);

  // Instant Loading State Check
  const [isLoading, setIsLoading] = useState(() => {
    if (isNew) {
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.dashboard < 300000;
        return !(store.dashboard && isFresh);
    }
    return true; // Always load for existing product fetch
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: '', name: '', price: 0, stock: 0, currency: 'BDT', description: '', long_description: '',
      categories: [], origin: '', story: '', is_featured: false, images: [], brand: [], unit: [], size: [], color: [],
      has_flash_deal: false, flash_deal_price: undefined, flash_deal_range: { startDate: undefined, endDate: undefined },
    },
  });

  const { fields, append, remove, swap } = useFieldArray({ control: form.control, name: 'images' });
  const watchedValues = form.watch();
  const isDirty = form.formState.isDirty;
  
  useEffect(() => {
    if (isNew && draftKey && !isLoading && (isDirty || watchedValues.name || watchedValues.images.length > 0)) {
        const timeout = setTimeout(() => { localStorage.setItem(draftKey, JSON.stringify(watchedValues)); }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [watchedValues, isNew, draftKey, isLoading, isDirty]);

  useEffect(() => {
    if (isNew && draftKey) {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                if (parsed.name || (parsed.images && parsed.images.length > 0)) setHasDraft(true);
            } catch (e) { console.error("Draft check failed", e); }
        }
    }
  }, [isNew, draftKey]);

  const applyDraft = () => {
    if (!draftKey) return;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
        try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.flash_deal_range) {
                if (parsed.flash_deal_range.startDate) parsed.flash_deal_range.startDate = new Date(parsed.flash_deal_range.startDate);
                if (parsed.flash_deal_range.endDate) parsed.flash_deal_range.endDate = new Date(parsed.flash_deal_range.endDate);
            }
            form.reset(parsed);
            setHasDraft(false);
            toast({ title: 'ড্রাফট রিকভার করা হয়েছে!' });
        } catch (e) { toast({ variant: 'destructive', title: 'ড্রাফট রিকভার করতে সমস্যা হয়েছে' }); }
    }
  };

  const fetchProduct = useCallback(async () => {
    if (isNew || !user) return;
    setIsLoading(true);
    const decodedProductId = decodeURIComponent(productId);
    const [{ data: productData, error }, { data: flashDealData }] = await Promise.all([
      supabase.from('products').select('*').match({ id: decodedProductId, site_id: user.id }).single(),
      supabase.from('flash_deals').select('*').eq('product_id', decodedProductId).eq('site_id', user.id).single()
    ]);

    if (error || !productData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Product not found.' });
      router.push(`/admin/products`);
      return;
    }
    
    form.reset({
      ...productData,
      images: (productData.images || []).map((img: any) => ({ imageUrl: img.imageUrl || '', imageHint: img.imageHint || '' })),
      has_flash_deal: !!flashDealData,
      flash_deal_price: flashDealData?.discount_price,
      flash_deal_range: flashDealData ? { startDate: new Date(flashDealData.start_date), endDate: new Date(flashDealData.end_date) } : { startDate: undefined, endDate: undefined },
    });
    setIsLoading(false);
  }, [productId, isNew, user, router, toast, form]);
  
  const fetchAttributes = useCallback(async (force = false) => {
    if (!user) return;
    const store = useAdminStore.getState();
    const isFresh = Date.now() - store.lastFetched.attributes < 300000;
    if (!force && store.attributes.length > 0 && isFresh) return;
    const { data } = await supabase.from('product_attributes').select('*').eq('site_id', user.id);
    if (data) setAttributes(data);
  }, [user, setAttributes]);
  
  const fetchCategories = useCallback(async (force = false) => {
    if (!user) return;
    const store = useAdminStore.getState();
    const isFresh = Date.now() - store.lastFetched.categories < 300000;
    if (!force && store.categories.length > 0 && isFresh) return;
    const { data } = await supabase.from('categories').select('*').eq('site_id', user.id);
    if (data) setCategories(data as Category[]);
  }, [user, setCategories]);

  useEffect(() => {
    if (!authLoading && user) {
        fetchAttributes();
        fetchCategories();
        if (isNew) setIsLoading(false);
        else fetchProduct();
    }
  }, [authLoading, user, isNew, fetchProduct, fetchAttributes, fetchCategories]);

  const groupedAttributes = useMemo(() => attributes.reduce((acc, attr) => { (acc[attr.type] = acc[attr.type] || []).push(attr.value); return acc; }, {} as Record<string, string[]>), [attributes]);

  const onSubmit = async (values: ProductFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    const { has_flash_deal, flash_deal_price, flash_deal_range, ...productValues } = values;
    try {
        const response = await fetch('/api/products/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isNew, siteId: user.id, productId: isNew ? undefined : decodeURIComponent(productId),
                productData: { ...productValues, images: productValues.images.filter((img) => img.imageUrl) },
                flashDealData: has_flash_deal ? { discount_price: flash_deal_price, start_date: flash_deal_range?.startDate instanceof Date ? flash_deal_range.startDate.toISOString() : flash_deal_range?.startDate, end_date: flash_deal_range?.endDate instanceof Date ? flash_deal_range.endDate.toISOString() : flash_deal_range?.endDate } : null
            })
        });
        if (!response.ok) throw new Error('Failed to save');
        if (isNew && draftKey) localStorage.removeItem(draftKey);
        invalidateEntity('products');
        invalidateEntity('dashboard');
        toast({ title: `Product ${isNew ? 'created' : 'updated'} successfully!` });
        router.push(`/admin/products`);
    } catch (error: any) { setIsSubmitting(false); toast({ variant: 'destructive', title: `Error`, description: error.message }); }
  };

  if (isLoading || authLoading) return <div className="space-y-6"><Skeleton className="h-8 w-1/2" /><Card><CardContent className="p-6 space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" /></CardContent></Card></div>;

  const isLimitReached = user?.product_limit !== null && (dashboard?.totalProducts || 0) >= user?.product_limit!;
  if (isNew && isLimitReached) return <div className="space-y-6"><Button variant="ghost" asChild className="-ml-4"><Link href={`/admin/products`}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button><Alert variant="destructive"><PackageCheck className="h-4 w-4" /><AlertTitle>Product Limit Reached</AlertTitle><AlertDescription>You have reached your limit of {user?.product_limit} products.</AlertDescription></Alert></div>;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4 -ml-4"><Link href={`/admin/products`}><ArrowLeft className="mr-2 h-4 w-4" />Back to Products</Link></Button>
      {isNew && hasDraft && (
        <Alert className="mb-6 border-primary bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500"><RotateCcw className="h-4 w-4 text-primary" /><AlertTitle className="font-bold">ড্রাফট পাওয়া গিয়েছে!</AlertTitle><AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><span className="text-foreground/90">আপনার কাছে একটি অসম্পূর্ণ পণ্যের তথ্য রয়েছে।</span><div className="flex gap-2 shrink-0"><Button variant="outline" size="sm" onClick={() => { localStorage.removeItem(draftKey!); setHasDraft(false); }} className="h-8 border-destructive text-destructive hover:bg-destructive/10">মুছে ফেলুন</Button><Button size="sm" onClick={applyDraft} className="h-8">ড্রাফট রিকভার করুন</Button></div></AlertDescription></Alert>
      )}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader><CardTitle>{isNew ? 'Add New Product' : `Edit: ${watchedValues.name}`}</CardTitle><CardDescription>Fill in the details for your product below.</CardDescription></CardHeader>
                <CardContent className="space-y-8">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Product Name</FormLabel><FormControl><Input {...field} placeholder="e.g., হিমসাগর আম (১ কেজি)" /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="id" render={({ field }) => (<FormItem><FormLabel>Product ID / Slug</FormLabel><FormControl><Input {...field} placeholder="e.g., himsagar-mango" disabled={!isNew} /></FormControl><FormDescription>A unique identifier. Auto-generated for new products.</FormDescription><FormMessage /></FormItem>)} />
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>Stock Quantity</FormLabel><FormControl><Input type="number" step="1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="categories" render={({ field }) => (
                        <FormItem><FormLabel>Categories</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate pr-2">{field.value?.length ? field.value.join(', ') : "Select categories"}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{categories.map((cat) => (<DropdownMenuCheckboxItem key={cat.id} checked={field.value?.includes(cat.name)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), cat.name] : field.value.filter((v) => v !== cat.name))}>{cat.name}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu><FormMessage /></FormItem>
                    )} />
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['brand', 'color', 'size', 'unit'].map((attr) => (
                            <FormField key={attr} control={form.control} name={attr as any} render={({ field }) => (
                                <FormItem><FormLabel className="capitalize">{attr}</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate pr-2">{field.value?.length ? field.value.join(', ') : `Select ${attr}`}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{(groupedAttributes[attr] || []).map((opt) => (<DropdownMenuCheckboxItem key={opt} checked={field.value?.includes(opt)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), opt] : field.value.filter((v: string) => v !== opt))}>{opt}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu><FormMessage /></FormItem>
                            )} />
                        ))}
                    </div>
                    <FormField control={form.control} name="long_description" render={({ field }) => (
                        <FormItem><div className="flex justify-between items-center mb-2"><FormLabel>Long Description</FormLabel><Button type="button" variant="outline" size="sm" onClick={async () => {
                            if (!watchedValues.name) return toast({ variant: 'destructive', title: 'পণ্যর নাম প্রয়োজন' });
                            setIsGenerating(true);
                            try {
                                const res = await fetch('/api/ai-settings/get', { method: 'POST', body: JSON.stringify({ siteId: user.id }) });
                                const settings = await res.json();
                                if (!res.ok || !settings.gemini_api_key) throw new Error('Gemini API key is missing.');
                                const result = await generateProductDescription({ apiKey: settings.gemini_api_key, name: watchedValues.name, description: watchedValues.description, categories: watchedValues.categories, origin: watchedValues.origin });
                                form.setValue('long_description', result.longDescription, { shouldValidate: true });
                                toast({ title: 'এআই ডেসক্রিপশন তৈরি হয়েছে!' });
                            } catch (e: any) { toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message }); } finally { setIsGenerating(false); }
                        }} disabled={isGenerating}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}Generate with AI</Button></div><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
            </Card>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isNew ? 'Create Product' : 'Save Changes'}</Button>
        </form>
      </Form>
    </div>
  );
}