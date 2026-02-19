
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
import { Loader2, ArrowLeft, Trash2, ChevronDown, PackageCheck, Wand2, RotateCcw, CheckCircle2, Star, Info, Sparkles, Plus, Ruler, Scale, X } from 'lucide-react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import RichTextEditor from '@/components/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FALLBACK_UNITS = ['KG', 'Litter', 'GM', 'ML', 'Pcs', 'Pkt', 'Box', 'Dozen'];
const FALLBACK_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

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
  color: z.array(z.string()).optional(),
  unit: z.string().optional(), // For single price unit
  images: z.array(z.object({ imageUrl: z.string().url('Must be a valid URL.'), imageHint: z.string().optional() })).min(1, 'At least one image is required.'),
  has_flash_deal: z.boolean().default(false),
  flash_deal_price: z.preprocess((val) => (val === '' || val == null ? undefined : parseFloat(String(val))), z.number().positive('Discount price must be a positive number.').optional()),
  flash_deal_range: z.object({ startDate: z.any().optional(), endDate: z.any().optional() }).optional(),
  use_variants: z.boolean().default(false),
  variant_type: z.enum(['unit', 'size']).default('unit'),
  variants: z.array(z.object({
    amount: z.string().optional(),
    unitType: z.string().optional(),
    size: z.string().optional(),
    price: z.preprocess((a) => parseFloat(String(a)), z.number().positive('Price must be positive')),
    stock: z.preprocess((a) => parseInt(String(a), 10), v => v == null ? 0 : v).optional(),
  })).optional().or(z.null()),
}).refine(data => {
    if (data.use_variants && data.variants) {
        if (data.variant_type === 'unit') {
            return data.variants.every(v => v.amount && v.unitType);
        }
        if (data.variant_type === 'size') {
            return data.variants.every(v => v.size);
        }
    }
    return true;
}, {
    message: "Required fields missing for variants.",
    path: ["variants"]
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

  const [isLoading, setIsLoading] = useState(() => {
    const store = useAdminStore.getState();
    if (isNew) return !(store.categories.length > 0);
    return true;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: '', name: '', price: 0, stock: 0, currency: 'BDT', description: '', long_description: '',
      categories: [], origin: '', story: '', is_featured: false, images: [], brand: [], color: [],
      has_flash_deal: false, flash_deal_price: undefined, flash_deal_range: { startDate: undefined, endDate: undefined },
      use_variants: false, variant_type: 'unit', variants: []
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage, move: moveImage } = useFieldArray({ control: form.control, name: 'images' });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control: form.control, name: 'variants' });
  
  const watchedValues = form.watch();
  
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
            form.reset(parsed);
            setHasDraft(false);
            toast({ title: 'ড্রাফট রিকভার করা হয়েছে!' });
        } catch (e) { toast({ variant: 'destructive', title: 'ড্রাফট রিকভার করতে সমস্যা হয়েছে' }); }
    }
  };

  const fetchProductData = useCallback(async () => {
    if (!user) return;

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
        } catch (error) { console.error("Lookup fetch error:", error); }
    };

    if (isNew) {
        await fetchLookups();
        setIsLoading(false);
        return;
    }

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
            
            let detectedType: 'unit' | 'size' = 'unit';
            const mappedVariants = (productData.variants || []).map((v: any) => {
                const variantString = v.unit || '';
                const unitMatch = variantString.match(/^([\d.]+)\s+(\w+)$/);
                if (unitMatch) {
                    detectedType = 'unit';
                    return { amount: unitMatch[1], unitType: unitMatch[2], size: '', price: v.price, stock: v.stock };
                }
                detectedType = 'size';
                return { amount: '', unitType: '', size: variantString, price: v.price, stock: v.stock };
            });

            form.reset({
                ...productData,
                images: (productData.images || []).map((img: any) => ({ imageUrl: img.imageUrl || '', imageHint: img.imageHint || '' })),
                has_flash_deal: !!flashDealData,
                flash_deal_price: flashDealData?.discount_price,
                flash_deal_range: flashDealData ? { startDate: new Date(flashDealData.start_date), endDate: new Date(flashDealData.end_date) } : { startDate: undefined, endDate: undefined },
                use_variants: !!(mappedVariants.length > 0),
                variant_type: detectedType,
                variants: mappedVariants
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
    if (user) fetchProductData();
  }, [user, fetchProductData]);

  const groupedAttributes = useMemo(() => attributes.reduce((acc, attr) => { 
    (acc[attr.type] = acc[attr.type] || []).push(attr.value); return acc; 
  }, {} as Record<string, string[]>), [attributes]);

  const unitOptions = useMemo(() => {
    const fromAttr = groupedAttributes['unit'] || [];
    return fromAttr.length > 0 ? fromAttr : FALLBACK_UNITS;
  }, [groupedAttributes]);

  const sizeOptions = useMemo(() => {
    const fromAttr = groupedAttributes['size'] || [];
    return fromAttr.length > 0 ? fromAttr : FALLBACK_SIZES;
  }, [groupedAttributes]);

  const handleBeautify = async () => {
    if (!watchedValues.name) return toast({ variant: 'destructive', title: 'আগে পণ্যের নাম প্রদান করুন' });
    setIsBeautifying(true);
    try {
        const response = await fetch('/api/products/ai/beautify-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: user?.id,
                name: watchedValues.name,
                description: watchedValues.description,
                story: watchedValues.story,
                origin: watchedValues.origin,
                categories: watchedValues.categories
            }),
        });
        const result = await response.json();
        if (response.ok) {
            form.setValue('name', result.name, { shouldValidate: true, shouldDirty: true });
            form.setValue('description', result.description, { shouldValidate: true, shouldDirty: true });
            form.setValue('story', result.story, { shouldValidate: true, shouldDirty: true });
            form.setValue('origin', result.origin, { shouldValidate: true, shouldDirty: true });
            form.setValue('long_description', result.longDescription, { shouldValidate: true, shouldDirty: true });
            toast({ title: 'SEO Beautification সম্পন্ন!' });
        } else { throw new Error(result.error); }
    } catch (e: any) { toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message }); } finally { setIsBeautifying(false); }
  };

  const handleGenerateDescription = async () => {
    if (!watchedValues.name) return toast({ variant: 'destructive', title: 'আগে পণ্যের নাম প্রদান করুন' });
    setIsGenerating(true);
    try {
        const response = await fetch('/api/products/ai/generate-description', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: user?.id,
                name: watchedValues.name,
                description: watchedValues.description,
                categories: watchedValues.categories,
                origin: watchedValues.origin
            }),
        });
        const result = await response.json();
        if (response.ok) {
            form.setValue('long_description', result.longDescription, { shouldValidate: true, shouldDirty: true });
            toast({ title: 'AI ম্যাজিক সম্পন্ন!' });
        } else { throw new Error(result.error); }
    } catch (e: any) { toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message }); } finally { setIsGenerating(false); }
  };

  const onSubmit = async (values: ProductFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    const { has_flash_deal, flash_deal_price, flash_deal_range, use_variants, variant_type, ...productValues } = values;
    
    if (use_variants && values.variants) {
        productValues.variants = values.variants.map(v => ({
            unit: variant_type === 'unit' ? `${v.amount} ${v.unitType}` : v.size || '',
            price: v.price,
            stock: v.stock || 0
        }));
    } else {
        productValues.variants = null;
    }

    try {
        const response = await fetch('/api/products/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isNew, siteId: user.id, productId: isNew ? undefined : decodeURIComponent(productId),
                productData: { ...productValues, images: productValues.images.filter((img) => img.imageUrl) },
                flashDealData: has_flash_deal ? { discount_price: flash_deal_price, start_date: flash_deal_range?.startDate, end_date: flash_deal_range?.endDate } : null
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

  if (isLoading || (authLoading && !user)) {
      return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8"><Skeleton className="h-64 w-full" /><Skeleton className="h-40 w-full" /></div>
                <div className="space-y-8"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>
            </div>
        </div>
      );
  }

  return (
    <div className="pb-20">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild className="-ml-4"><Link href={`/admin/products`}><ArrowLeft className="mr-2 h-4 w-4" />পণ্য তালিকায় ফিরে যান</Link></Button>
        <div className="flex gap-2">
             <Button type="button" variant="outline" onClick={() => router.push('/admin/products')}>বাতিল</Button>
             <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? 'পণ্যটি তৈরি করুন' : 'পরিবর্তনগুলো সেভ করুন'}
            </Button>
        </div>
      </div>

      {isNew && hasDraft && (
        <Alert className="mb-6 border-primary bg-primary/5">
            <RotateCcw className="h-4 w-4 text-primary" />
            <AlertTitle className="font-bold">অসম্পূর্ণ ডাটা পাওয়া গেছে!</AlertTitle>
            <AlertDescription className="mt-2 flex justify-between items-center gap-4">
                <span>আপনি কি আগের অসম্পূর্ণ ডাটা রিকভার করতে চান?</span>
                <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { localStorage.removeItem(draftKey!); setHasDraft(false); }}>মুছে ফেলুন</Button><Button size="sm" onClick={applyDraft}>রিকভার করুন</Button></div>
            </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0">
                            <div><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> সাধারণ তথ্য</CardTitle><CardDescription>পণ্যের নাম এবং বর্ণনা প্রদান করুন।</CardDescription></div>
                            <Button type="button" variant="secondary" size="sm" onClick={handleBeautify} disabled={isBeautifying}>{isBeautifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Beautify Details</Button>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel className="font-bold">পণ্যের নাম</FormLabel><FormControl><Input {...field} placeholder="যেমন: হিমসাগর আম (৫ কেজি)" className="h-12 text-lg font-medium" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="id" render={({ field }) => (<FormItem><FormLabel>ইউনিক আইডি / স্লাগ (Slug)</FormLabel><FormControl><div className="relative"><Input {...field} placeholder="যেমন: himsagar-mango-5kg" disabled={!isNew} className="pl-8 font-mono text-sm bg-muted/20" /><span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">/</span></div></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="font-bold">সংক্ষিপ্ত বিবরণ</FormLabel><FormControl><Textarea {...field} placeholder="২-৩ লাইনে পণ্যের হাইলাইট লিখুন।" rows={3} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="story" render={({ field }) => (<FormItem><FormLabel className="font-bold">আমাদের গল্প (Our Story)</FormLabel><FormControl><Textarea {...field} placeholder="পণ্যটি সম্পর্কে কোনো বিশেষ প্রেক্ষাপট থাকলে এখানে লিখুন।" rows={3} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> পণ্যের ছবিসমূহ</CardTitle></CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {imageFields.map((imageItem, imageIndex) => (
                                    <div key={imageItem.id} className={cn("relative aspect-square rounded-xl overflow-hidden border-2 group", imageIndex === 0 ? "border-primary ring-4 ring-primary/10" : "border-border")}>
                                        <Image src={imageItem.imageUrl} alt={`Product ${imageIndex + 1}`} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            {imageIndex !== 0 && <Button type="button" variant="secondary" size="sm" className="h-8 text-[10px] rounded-full" onClick={() => moveImage(imageIndex, 0)}><Star className="h-3 w-3 mr-1" /> থাম্বনেইল করুন</Button>}
                                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeImage(imageIndex)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                        {imageIndex === 0 && <Badge className="absolute top-2 left-2">থাম্বনেইল</Badge>}
                                    </div>
                                ))}
                                <div className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"><ImageUploader multiple onUpload={(res) => appendImage({ imageUrl: res.info.secure_url, imageHint: '' })} label="ছবি যোগ করুন" /></div>
                            </div>
                            <FormMessage className="mt-4">{form.formState.errors.images?.message}</FormMessage>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0">
                            <div><CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> বিস্তারিত বিবরণ</CardTitle></div>
                            <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>{isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} AI দিয়ে জেনারেট করুন</Button>
                        </CardHeader>
                        <CardContent className="pt-6"><FormField control={form.control} name="long_description" render={({ field }) => (<FormItem><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /></CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30"><CardTitle>মূল্য এবং স্টক</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="use_variants" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20"><div className="space-y-0.5"><FormLabel className="text-sm font-bold">একাধিক মূল্য ব্যবহার করুন</FormLabel><FormDescription className="text-[10px]">ওজন বা সাইজ অনুযায়ী আলাদা দাম।</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={(val) => { field.onChange(val); if(val && variantFields.length === 0) appendVariant({ amount: '1', unitType: unitOptions[0], size: '', price: 0, stock: 0 }); }} /></FormControl></FormItem>)} />

                            {!watchedValues.use_variants ? (
                                <div className="space-y-6 animate-in fade-in">
                                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>বিক্রয় মূল্য (BDT)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-11 font-bold text-lg" /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="unit" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>একক (Unit)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger></FormControl>
                                                    <SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="stock" render={({ field }) => (<FormItem><FormLabel>স্টক পরিমাণ</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <Tabs value={watchedValues.variant_type} onValueChange={(val) => form.setValue('variant_type', val as any)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="unit" className="gap-2"><Scale className="h-4 w-4" /> Unit Based</TabsTrigger>
                                            <TabsTrigger value="size" className="gap-2"><Ruler className="h-4 w-4" /> Size Based</TabsTrigger>
                                        </TabsList>
                                        
                                        <TabsContent value="unit" className="space-y-4 mt-4">
                                            {variantFields.map((v, i) => (
                                                <div key={v.id} className="p-3 border rounded-xl bg-card space-y-3 relative group">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <FormField control={form.control} name={`variants.${i}.amount`} render={({ field }) => (
                                                            <FormItem><FormLabel className="text-[10px] uppercase font-bold">পরিমাণ</FormLabel><FormControl><Input placeholder="১" {...field} className="h-9" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`variants.${i}.unitType`} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[10px] uppercase font-bold">একক</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value}>
                                                                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="কেজি" /></SelectTrigger></FormControl>
                                                                    <SelectContent>{unitOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <FormField control={form.control} name={`variants.${i}.price`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">মূল্য</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-9 font-bold" /></FormControl></FormItem>)} />
                                                        <FormField control={form.control} name={`variants.${i}.stock`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">স্টক</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>)} />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVariant(i)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => appendVariant({ amount: '1', unitType: unitOptions[0], size: '', price: 0, stock: 0 })}><Plus className="mr-2 h-4 w-4" /> নতুন ওজন যোগ করুন</Button>
                                        </TabsContent>

                                        <TabsContent value="size" className="space-y-4 mt-4">
                                            {variantFields.map((v, i) => (
                                                <div key={v.id} className="p-3 border rounded-xl bg-card space-y-3 relative group">
                                                    <FormField control={form.control} name={`variants.${i}.size`} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase font-bold">সাইজ</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="সিলেক্ট সাইজ" /></SelectTrigger></FormControl>
                                                                <SelectContent>{sizeOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <FormField control={form.control} name={`variants.${i}.price`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">মূল্য</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-9 font-bold" /></FormControl></FormItem>)} />
                                                        <FormField control={form.control} name={`variants.${i}.stock`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">স্টক</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>)} />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVariant(i)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => appendVariant({ amount: '', unitType: '', size: sizeOptions[0], price: 0, stock: 0 })}><Plus className="mr-2 h-4 w-4" /> নতুন সাইজ যোগ করুন</Button>
                                        </TabsContent>
                                    </Tabs>
                                    <FormMessage className="text-xs">{form.formState.errors.variants?.message}</FormMessage>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30"><CardTitle>ক্যাটাগরি এবং ফিল্টার</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="categories" render={({ field }) => (<FormItem><FormLabel>ক্যাটাগরি সিলেক্ট করুন</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-11 justify-between font-normal"><span className="truncate">{field.value?.length ? field.value.join(', ') : "সিলেক্ট করুন"}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{categories.map((cat) => (<DropdownMenuCheckboxItem key={cat.id} checked={field.value?.includes(cat.name)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), cat.name] : field.value.filter((v) => v !== cat.name))}>{cat.name}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu></FormItem>)} />
                            <FormField control={form.control} name="origin" render={({ field }) => (<FormItem><FormLabel>উৎপত্তি স্থল (Origin)</FormLabel><FormControl><Input {...field} placeholder="যেমন: রাজশাহী, খুলনা" className="h-11" /></FormControl></FormItem>)} />
                            <div className="space-y-4">
                                {(['brand', 'color'] as const).map((attrName) => (
                                    <FormField key={attrName} control={form.control} name={attrName as any} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="capitalize">{attrName}</FormLabel>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="w-full h-11 justify-between font-normal">
                                                        <span className="truncate">{field.value?.length ? field.value.join(', ') : `সিলেক্ট ${attrName}`}</span>
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                                    {(groupedAttributes[attrName] || []).map((opt) => (
                                                        <DropdownMenuCheckboxItem key={opt} checked={field.value?.includes(opt)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), opt] : field.value.filter((v: string) => v !== opt))}>
                                                            {opt}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                    <Button type="submit" disabled={isSubmitting} className="min-w-[150px] shadow-lg shadow-primary/20">{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><CheckCircle2 className="mr-2 h-4 w-4" /> {isNew ? 'পণ্যটি তৈরি করুন' : 'সেভ করুন'}</>}</Button>
                </div>
            </div>
        </form>
      </Form>
    </div>
  );
}
