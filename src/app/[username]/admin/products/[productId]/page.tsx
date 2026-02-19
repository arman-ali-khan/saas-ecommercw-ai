'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Trash2, ChevronDown, PackageCheck, Wand2, RotateCcw, CheckCircle2, Star, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import type { Product, Category, ProductAttribute } from '@/types';
import ImageUploader from '@/components/image-uploader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import RichTextEditor from '@/components/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const productFormSchema = z.object({
  id: z.string().min(3, 'ID/Slug must be at least 3 characters.').regex(/^[a-z0-9\u0980-\u09FF-]+$/, 'Slug can only contain lowercase letters, numbers, hyphens, and Bengali characters.'),
  name: z.string().min(1, 'Name is required.'),
  price: z.preprocess((a) => parseFloat(String(a)), z.number().positive('Price must be a positive number.')),
  stock: z.preprocess((a) => parseInt(String(a), 10), z.number().min(0, "Stock can't be negative.").default(0)),
  currency: z.string().default('BDT'),
  description: z.string().min(10, 'Short description is required (min 10 chars).'),
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
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ManageProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { attributes, categories, setAttributes, setCategories, dashboard, invalidateEntity } = useAdminStore();

  const productId = params.productId as string;
  const isNew = productId === 'new';
  const draftKey = useMemo(() => user ? `unsaved_product_draft_${user.id}` : null, [user]);

  // Initial loading state based on store content to prevent flickering
  const [isLoading, setIsLoading] = useState(() => {
    if (isNew) {
        const store = useAdminStore.getState();
        return !(store.categories.length > 0 && store.attributes.length > 0);
    }
    return true;
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

  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: 'images' });
  const watchedValues = form.watch();
  
  // Auto-Slug Logic
  useEffect(() => {
    if (isNew && watchedValues.name) {
        const slug = watchedValues.name
            .toLowerCase()
            .replace(/[^\u0980-\u09FFa-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
        form.setValue('id', slug, { shouldValidate: true });
    }
  }, [watchedValues.name, isNew, form]);

  useEffect(() => {
    if (isNew && draftKey && !isLoading && form.formState.isDirty) {
        const timeout = setTimeout(() => { 
            const dataToSave = { ...form.getValues() };
            if (dataToSave.flash_deal_range?.startDate instanceof Date) dataToSave.flash_deal_range.startDate = dataToSave.flash_deal_range.startDate.toISOString();
            if (dataToSave.flash_deal_range?.endDate instanceof Date) dataToSave.flash_deal_range.endDate = dataToSave.flash_deal_range.endDate.toISOString();
            localStorage.setItem(draftKey, JSON.stringify(dataToSave)); 
        }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [watchedValues, isNew, draftKey, isLoading, form.formState.isDirty, form]);

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

  const fetchProductData = useCallback(async () => {
    if (!user) return;

    // Background fetch logic for lookups
    const fetchLookups = async () => {
        try {
            const [attrResponse, catResponse] = await Promise.all([
                fetch('/api/attributes/list', { method: 'POST', body: JSON.stringify({ siteId: user.id }), headers: { 'Content-Type': 'application/json' } }),
                fetch('/api/categories/list', { method: 'POST', body: JSON.stringify({ siteId: user.id }), headers: { 'Content-Type': 'application/json' } })
            ]);
            
            const attrResult = await attrResponse.json();
            const catResult = await catResponse.json();

            if (attrResponse.ok) setAttributes(attrResult.attributes as ProductAttribute[]);
            if (catResponse.ok) setCategories(catResult.categories as Category[]);
        } catch (error) {
            console.error("Lookup fetch error:", error);
        }
    };

    // If it's a new product and we have cached lookups, just refresh in background
    if (isNew) {
        fetchLookups();
        setIsLoading(false);
        return;
    }

    // For editing, we need the product details
    setIsLoading(true);
    try {
        await fetchLookups();
        const response = await fetch('/api/products/get', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, siteId: user.id }),
        });
        const result = await response.json();

        if (response.ok) {
            const { product: productData, flashDeal: flashDealData } = result;
            form.reset({
                ...productData,
                images: (productData.images || []).map((img: any) => ({ imageUrl: img.imageUrl || '', imageHint: img.imageHint || '' })),
                has_flash_deal: !!flashDealData,
                flash_deal_price: flashDealData?.discount_price,
                flash_deal_range: flashDealData ? { startDate: new Date(flashDealData.start_date), endDate: new Date(flashDealData.end_date) } : { startDate: undefined, endDate: undefined },
            });
        } else {
            throw new Error(result.error || 'Product not found.');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        router.push(`/admin/products`);
    } finally {
        setIsLoading(false);
    }
  }, [productId, isNew, user, router, toast, form, setAttributes, setCategories]);

  useEffect(() => {
    if (!authLoading && user) {
        fetchProductData();
    }
  }, [authLoading, user, fetchProductData]);

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
        if (!response.ok) {
            const res = await response.json();
            throw new Error(res.error || 'Failed to save');
        }
        if (isNew && draftKey) localStorage.removeItem(draftKey);
        invalidateEntity('products');
        invalidateEntity('dashboard');
        toast({ title: `Product ${isNew ? 'created' : 'updated'} successfully!` });
        router.push(`/admin/products`);
    } catch (error: any) { setIsSubmitting(false); toast({ variant: 'destructive', title: `Error`, description: error.message }); }
  };

  const handleSetMainImage = (index: number) => {
    if (index === 0) return;
    move(index, 0);
    toast({ title: 'থাম্বনেইল সেট করা হয়েছে' });
  };

  if (isLoading && isNew) {
      // Return a very minimal shell if we truly have no data yet
      return <div className="space-y-6"><Skeleton className="h-8 w-1/2" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (isLoading || authLoading) return <div className="space-y-6"><Skeleton className="h-8 w-1/2" /><Card><CardContent className="p-6 space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-40 w-full" /></CardContent></Card></div>;

  const totalProductsCount = dashboard?.totalProducts || 0;
  const isLimitReached = user?.product_limit !== null && totalProductsCount >= (user?.product_limit || 0);
  
  if (isNew && isLimitReached) return <div className="space-y-6"><Button variant="ghost" asChild className="-ml-4"><Link href={`/admin/products`}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button><Alert variant="destructive"><PackageCheck className="h-4 w-4" /><AlertTitle>Product Limit Reached</AlertTitle><AlertDescription>You have reached your limit of {user?.product_limit} products.</AlertDescription></Alert></div>;

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild className="-ml-4">
            <Link href={`/admin/products`}><ArrowLeft className="mr-2 h-4 w-4" />পণ্য তালিকায় ফিরে যান</Link>
        </Button>
        <div className="flex gap-2">
             <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>বাতিল</Button>
             <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? 'পণ্যটি তৈরি করুন' : 'পরিবর্তনগুলো সেভ করুন'}
            </Button>
        </div>
      </div>

      {isNew && hasDraft && (
        <Alert className="mb-6 border-primary bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
            <RotateCcw className="h-4 w-4 text-primary" />
            <AlertTitle className="font-bold">অসম্পূর্ণ ডাটা পাওয়া গেছে!</AlertTitle>
            <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-foreground/90">আপনার কাছে একটি অসম্পূর্ণ পণ্যের তথ্য রয়েছে। আপনি কি সেটি রিকভার করতে চান?</span>
                <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => { localStorage.removeItem(draftKey!); setHasDraft(false); }} className="h-8 border-destructive text-destructive hover:bg-destructive/10">মুছে ফেলুন</Button>
                    <Button size="sm" onClick={applyDraft} className="h-8">রিকভার করুন</Button>
                </div>
            </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> সাধারণ তথ্য</CardTitle>
                            <CardDescription>পণ্যের নাম, স্লাগ এবং সংক্ষিপ্ত বর্ণনা প্রদান করুন।</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="name" render={({ field: nameField }) => (
                                <FormItem>
                                    <FormLabel className="font-bold">পণ্যের নাম</FormLabel>
                                    <FormControl><Input {...nameField} placeholder="যেমন: হিমসাগর আম (৫ কেজি)" className="h-12 text-lg font-medium" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="id" render={({ field: idField }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">ইউনিক আইডি / স্লাগ (Slug) <Badge variant="secondary" className="text-[10px] h-4">স্বয়ংক্রিয়</Badge></FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input {...idField} placeholder="যেমন: himsagar-mango-5kg" disabled={!isNew} className="pl-8 font-mono text-sm bg-muted/20" />
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                                        </div>
                                    </FormControl>
                                    <FormDescription className="text-[11px]">এটি আপনার পণ্যের ইউআরএল হিসেবে ব্যবহৃত হবে।</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="description" render={({ field: descField }) => (
                                <FormItem>
                                    <FormLabel className="font-bold">সংক্ষিপ্ত বিবরণ (Short Description)</FormLabel>
                                    <FormControl><Textarea {...descField} placeholder="পণ্য সম্পর্কে ছোট করে ২-৩ লাইন লিখুন যা গ্রাহক প্রথমেই দেখবে।" rows={3} className="resize-none" /></FormControl>
                                    <FormDescription className="text-[11px]">এটি পণ্যের নামের নিচে প্রদর্শিত হবে।</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> পণ্যের ছবিসমূহ</CardTitle>
                            <CardDescription>পণ্যের পরিষ্কার এবং আকর্ষণীয় ছবি আপলোড করুন।</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormItem>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {fields.map((imageItem, imageIndex) => (
                                        <div key={imageItem.id} className={cn(
                                            "relative aspect-square rounded-xl overflow-hidden border-2 group transition-all",
                                            imageIndex === 0 ? "border-primary ring-4 ring-primary/10 shadow-lg" : "border-border"
                                        )}>
                                            <Image src={imageItem.imageUrl} alt={`Product ${imageIndex + 1}`} fill className="object-cover" />
                                            
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                                {imageIndex !== 0 && (
                                                    <Button 
                                                        type="button" 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="h-8 text-[10px] rounded-full"
                                                        onClick={() => handleSetMainImage(imageIndex)}
                                                    >
                                                        <Star className="h-3 w-3 mr-1" /> থাম্বনেইল করুন
                                                    </Button>
                                                )}
                                                <Button 
                                                    type="button" 
                                                    variant="destructive" 
                                                    size="icon" 
                                                    className="h-8 w-8 rounded-full" 
                                                    onClick={() => remove(imageIndex)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {imageIndex === 0 && (
                                                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] shadow-sm">থাম্বনেইল</Badge>
                                            )}
                                        </div>
                                    ))}
                                    <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <ImageUploader multiple onUpload={(res) => append({ imageUrl: res.info.secure_url, imageHint: '' })} label="ছবি যোগ করুন" />
                                    </div>
                                </div>
                                <FormMessage className="mt-4">{form.formState.errors.images?.message}</FormMessage>
                            </FormItem>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> বিস্তারিত বিবরণ</CardTitle>
                                <CardDescription>পণ্যের বিস্তারিত তথ্য এবং গল্প শেয়ার করুন।</CardDescription>
                            </div>
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
                                onClick={async () => {
                                    if (!watchedValues.name) return toast({ variant: 'destructive', title: 'আগে পণ্যের নাম প্রদান করুন' });
                                    setIsGenerating(true);
                                    try {
                                        const res = await fetch('/api/ai-settings/get', { method: 'POST', body: JSON.stringify({ siteId: user.id }), headers: { 'Content-Type': 'application/json' } });
                                        const settings = await res.json();
                                        if (!res.ok || !settings.gemini_api_key) throw new Error('এআই সেটিংস থেকে Gemini API Key কনফিগার করুন।');
                                        const result = await generateProductDescription({ 
                                            apiKey: settings.gemini_api_key, 
                                            name: watchedValues.name, 
                                            description: watchedValues.description, 
                                            categories: watchedValues.categories, 
                                            origin: watchedValues.origin 
                                        });
                                        form.setValue('long_description', result.longDescription, { shouldValidate: true });
                                        toast({ title: 'AI ম্যাজিক সম্পন্ন!', description: 'বিস্তারিত বিবরণ সফলভাবে তৈরি হয়েছে।' });
                                    } catch (e: any) { toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message }); } finally { setIsGenerating(false); }
                                }} 
                                disabled={isGenerating}
                            >
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                AI দিয়ে জেনারেট করুন
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <FormField control={form.control} name="long_description" render={({ field: longDescField }) => (
                                <FormItem>
                                    <FormControl><RichTextEditor value={longDescField.value || ''} onChange={longDescField.onChange} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle>মূল্য এবং স্টক</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="price" render={({ field: priceField }) => (
                                <FormItem>
                                    <FormLabel>বিক্রয় মূল্য (BDT)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...priceField} className="h-11 font-bold text-lg" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="stock" render={({ field: stockField }) => (
                                <FormItem>
                                    <FormLabel>স্টক পরিমাণ (Stock)</FormLabel>
                                    <FormControl><Input type="number" step="1" {...stockField} className="h-11" /></FormControl>
                                    <FormDescription className="text-[10px]">আপনার কাছে কতগুলো পণ্য বিক্রয়ের জন্য রয়েছে।</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30">
                            <CardTitle>ক্যাটাগরি এবং ফিল্টার</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="categories" render={({ field: catField }) => (
                                <FormItem>
                                    <FormLabel>ক্যাটাগরি সিলেক্ট করুন</FormLabel>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" className="w-full h-11 justify-between font-normal">
                                                <span className="truncate pr-2">{catField.value?.length ? catField.value.join(', ') : "সিলেক্ট করুন"}</span>
                                                <ChevronDown className="h-4 w-4 opacity-50" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                            {categories.map((cat) => (
                                                <DropdownMenuCheckboxItem 
                                                    key={cat.id} 
                                                    checked={catField.value?.includes(cat.name)} 
                                                    onCheckedChange={(checked) => catField.onChange(checked ? [...(catField.value || []), cat.name] : catField.value.filter((v) => v !== cat.name))}
                                                >
                                                    {cat.name}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="origin" render={({ field: originField }) => (
                                <FormItem>
                                    <FormLabel>উৎপত্তি স্থল (Origin)</FormLabel>
                                    <FormControl><Input {...originField} placeholder="যেমন: রাজশাহী, খুলনা" className="h-11" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="space-y-4">
                                {(['brand', 'color', 'size', 'unit'] as const).map((attrName) => (
                                    <FormField key={attrName} control={form.control} name={attrName as any} render={({ field: attrValField }) => (
                                        <FormItem>
                                            <FormLabel className="capitalize">{attrName === 'unit' ? 'পরিমাপের একক (Unit)' : attrName}</FormLabel>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="w-full h-11 justify-between font-normal">
                                                        <span className="truncate pr-2">{attrValField.value?.length ? attrValField.value.join(', ') : `সিলেক্ট ${attrName}`}</span>
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                                    {(groupedAttributes[attrName] || []).map((opt) => (
                                                        <DropdownMenuCheckboxItem 
                                                            key={opt} 
                                                            checked={attrValField.value?.includes(opt)} 
                                                            onCheckedChange={(checked) => attrValField.onChange(checked ? [...(attrValField.value || []), opt] : attrValField.value.filter((v: string) => v !== opt))}
                                                        >
                                                            {opt}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40 md:left-[220px] lg:left-[280px]">
                <div className="container max-w-5xl mx-auto flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>বাতিল করুন</Button>
                    <Button type="submit" disabled={isSubmitting} className="min-w-[150px] shadow-lg shadow-primary/20">
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> সেভ হচ্ছে...</>
                        ) : (
                            <><CheckCircle2 className="mr-2 h-4 w-4" /> {isNew ? 'পণ্যটি তৈরি করুন' : 'পরিবর্তনগুলো সেভ করুন'}</>
                        )}
                    </Button>
                </div>
            </div>
        </form>
      </Form>
    </div>
  );
}
