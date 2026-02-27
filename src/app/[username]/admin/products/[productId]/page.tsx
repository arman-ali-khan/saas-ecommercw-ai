
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
import { 
    Loader2, 
    ArrowLeft, 
    Trash2, 
    ChevronDown, 
    Wand2, 
    Plus, 
    Ruler, 
    Scale, 
    X, 
    Info, 
    Star, 
    CheckCircle2, 
    Tags as TagsIcon, 
    LayoutGrid,
    ImageIcon,
    Search,
    ChevronLeft,
    ChevronRight,
    Check,
    Save
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import type { Product, Category, ProductAttribute, SiteImage, ProductVariant } from '@/types';
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
  price: z.preprocess((val) => (val === '' || val == null ? 0 : parseFloat(String(val))), z.number().min(0).default(0)),
  stock: z.preprocess((val) => (val === '' || val == null ? 0 : parseInt(String(val), 10)), z.number().min(0, "Stock can't be negative.").default(0)),
  currency: z.string().default('BDT'),
  description: z.string().min(10, 'Short description is required (min 10 chars).'),
  long_description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  origin: z.string().optional(),
  story: z.string().optional(),
  is_featured: z.boolean().default(false),
  brand: z.array(z.string()).optional().default([]),
  color: z.array(z.string()).optional().default([]),
  unit: z.string().optional().default(''),
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
    price: z.preprocess((val) => (val === '' || val == null ? 0 : parseFloat(String(val))), z.number().min(0).default(0)),
    stock: z.preprocess((val) => (val === '' || val == null ? 0 : parseInt(String(val), 10)), z.number().min(0).default(0)),
  })).optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ManageProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { attributes, categories, images: galleryImages, setAttributes, setCategories, setImages, invalidateEntity, dashboard } = useAdminStore();

  const productId = params.productId as string;
  const isNew = productId === 'new';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBeautifying, setIsBeautifying] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Image Picker State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerPage, setPickerPage] = useState(1);
  const IMAGES_PER_PAGE = 8;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: '', name: '', price: 0, stock: 0, currency: 'BDT', description: '', long_description: '',
      categories: [], tags: [], origin: '', story: '', is_featured: false, images: [], brand: [], color: [], unit: '',
      has_flash_deal: false, flash_deal_price: undefined, flash_deal_range: { startDate: undefined, endDate: undefined },
      use_variants: false, variant_type: 'unit', variants: []
    },
  });

  const { fields: imageFields, append: appendImage, remove: removeImage } = useFieldArray({ control: form.control, name: 'images' });
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({ control: form.control, name: 'variants' });
  
  const watchedValues = form.watch();
  const productName = form.watch('name');

  const productLimit = user?.product_limit;
  const currentProductCount = dashboard?.totalProducts || 0;
  const isLimitReached = isNew && productLimit !== null && currentProductCount >= productLimit;

  useEffect(() => {
    if (isNew && productName) {
      const slug = productName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0980-\u09FF-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
      form.setValue('id', slug, { shouldValidate: true });
    }
  }, [productName, isNew, form]);
  
  const fetchProductData = useCallback(async () => {
    if (!user) return;

    const fetchLookups = async () => {
        try {
            const [attrResponse, catResponse, imgResponse] = await Promise.all([
                fetch('/api/attributes/list', { method: 'POST', body: JSON.stringify({ siteId: user.id }), headers: { 'Content-Type': 'application/json' } }),
                fetch('/api/categories/list', { method: 'POST', body: JSON.stringify({ siteId: user.id }), headers: { 'Content-Type': 'application/json' } }),
                fetch('/api/images/list', { method: 'POST', body: JSON.stringify({ siteId: user.id }), headers: { 'Content-Type': 'application/json' } })
            ]);
            const attrResult = await attrResponse.json();
            const catResult = await catResponse.json();
            const imgResult = await imgResponse.json();

            if (attrResponse.ok) setAttributes(attrResult.attributes as ProductAttribute[]);
            if (catResponse.ok) setCategories(catResult.categories as Category[]);
            if (imgResponse.ok) setImages(imgResult.images as SiteImage[]);
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
            const mappedVariants = (productData.variants || []).map((vItem: any) => {
                const variantString = vItem.unit || '';
                const unitMatch = variantString.match(/^([\d.]+)\s+(.+)$/);
                if (unitMatch) {
                    detectedType = 'unit';
                    return { amount: unitMatch[1], unitType: unitMatch[2], size: '', price: vItem.price, stock: vItem.stock };
                }
                detectedType = 'size';
                return { amount: '', unitType: '', size: variantString, price: vItem.price, stock: vItem.stock };
            });

            form.reset({
                ...productData,
                brand: Array.isArray(productData.brand) ? productData.brand : [],
                color: Array.isArray(productData.color) ? productData.color : [],
                categories: Array.isArray(productData.categories) ? productData.categories : [],
                tags: Array.isArray(productData.tags) ? productData.tags : [],
                unit: productData.unit || '',
                images: (productData.images || []).map((imgItem: any) => ({ imageUrl: imgItem.imageUrl || '', imageHint: imgItem.imageHint || '' })),
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
  }, [productId, isNew, user, router, toast, form, setAttributes, setCategories, setImages]);

  useEffect(() => {
    if (user) fetchProductData();
  }, [user, fetchProductData]);

  const groupedAttributes = useMemo(() => {
    if (!attributes || !Array.isArray(attributes)) return {} as Record<string, string[]>;
    return attributes.reduce((accMap, attrRecord) => { 
        const type = attrRecord.type;
        if (!accMap[type]) accMap[type] = [];
        accMap[type].push(attrRecord.value);
        return accMap; 
    }, {} as Record<string, string[]>);
  }, [attributes]);

  const unitOptions = useMemo(() => {
    const fromAttr = groupedAttributes['unit'] || [];
    return fromAttr.length > 0 ? fromAttr : FALLBACK_UNITS;
  }, [groupedAttributes]);

  const sizeOptions = useMemo(() => {
    const fromAttr = groupedAttributes['size'] || [];
    return fromAttr.length > 0 ? fromAttr : FALLBACK_SIZES;
  }, [groupedAttributes]);

  const tagOptions = useMemo(() => groupedAttributes['tag'] || [], [groupedAttributes]);

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
            form.setValue('tags', result.tags || [], { shouldValidate: true, shouldDirty: true });
            form.setValue('long_description', result.longDescription, { shouldValidate: true, shouldDirty: true });
            toast({ title: 'SEO Beautification & Description সম্পন্ন!' });
        } else { throw new Error(result.error); }
    } catch (e: any) { toast({ variant: 'destructive', title: 'ত্রুটি', description: e.message }); } finally { setIsBeautifying(false); }
  };

  const onSubmit = async (values: ProductFormData, exit: boolean = true) => {
    if (!user) return;
    if (isLimitReached) {
        toast({ variant: 'destructive', title: 'Limit Reached', description: 'আপনার প্রোডাক্ট লিমিট শেষ হয়ে গেছে। আরও পণ্য যোগ করতে আপনার সাবস্ক্রিপশন আপগ্রেড করুন।' });
        return;
    }
    setIsSubmitting(true);
    const { has_flash_deal, flash_deal_price, flash_deal_range, use_variants, variant_type, ...productValues } = values;
    
    let processedVariants = null;
    if (use_variants && values.variants && values.variants.length > 0) {
        processedVariants = values.variants.map(vVar => ({
            unit: variant_type === 'unit' ? `${vVar.amount || '1'} ${vVar.unitType || unitOptions[0]}` : vVar.size || sizeOptions[0],
            price: vVar.price,
            stock: vVar.stock || 0
        }));
    }

    try {
        const response = await fetch('/api/products/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                isNew, siteId: user.id, productId: isNew ? undefined : decodeURIComponent(productId),
                productData: { 
                    ...productValues, 
                    variants: processedVariants,
                    images: productValues.images.filter((imgItem) => imgItem.imageUrl) 
                },
                flashDealData: has_flash_deal ? { discount_price: flash_deal_price, start_date: flash_deal_range?.startDate, end_date: flash_deal_range?.endDate } : null
            })
        });
        const res = await response.json();
        if (!response.ok) {
            throw new Error(res.error || 'Failed to save');
        }
        invalidateEntity('products');
        invalidateEntity('dashboard');
        toast({ title: `Product ${isNew ? 'created' : 'updated'} successfully!` });
        
        if (exit) {
            router.push(`/admin/products`);
        } else {
            setIsSubmitting(false);
            if (isNew && res.product?.id) {
                router.replace(`/admin/products/${res.product.id}`);
            } else {
                fetchProductData();
            }
        }
    } catch (error: any) { setIsSubmitting(false); toast({ variant: 'destructive', title: `Error`, description: error.message }); }
  };

  const handleAddTag = (tagVal: string, currentTags: string[], onChange: (val: string[]) => void) => {
    if (tagVal && !currentTags.includes(tagVal)) {
        onChange([...currentTags, tagVal]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagVal: string, currentTags: string[], onChange: (val: string[]) => void) => {
    onChange(currentTags.filter(tItem => tItem !== tagVal));
  };

  // Image Picker Logic
  const filteredGallery = useMemo(() => {
    return galleryImages.filter(img => 
        (img.name || '').toLowerCase().includes(pickerSearch.toLowerCase())
    );
  }, [galleryImages, pickerSearch]);

  const paginatedGallery = useMemo(() => {
    const start = (pickerPage - 1) * IMAGES_PER_PAGE;
    return filteredGallery.slice(start, start + IMAGES_PER_PAGE);
  }, [filteredGallery, pickerPage]);

  const totalPickerPages = Math.ceil(filteredGallery.length / IMAGES_PER_PAGE);

  const handlePickerImageSelect = (url: string) => {
    const currentImages = form.getValues('images') || [];
    if (currentImages.some(img => img.imageUrl === url)) {
        form.setValue('images', currentImages.filter(img => img.imageUrl !== url));
    } else {
        appendImage({ imageUrl: url, imageHint: '' });
    }
  };

  const handlePickerUploadSuccess = async (uploadRes: any) => {
    if (!user) return;
    try {
        const response = await fetch('/api/images/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                siteId: user.id,
                url: uploadRes.info.secure_url,
                name: uploadRes.info.original_filename
            }),
        });
        if (response.ok) {
            const result = await response.json();
            const newImg = result.image;
            setImages([newImg, ...galleryImages]);
            appendImage({ imageUrl: newImg.url, imageHint: '' });
            toast({ title: 'Image uploaded and selected!' });
        }
    } catch (e) {
        console.error("Picker upload save error:", e);
    }
  };

  if (isLoading || (authLoading && !user)) {
      return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-10 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30"><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </CardContent>
                    </Card>
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30"><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-4 gap-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-xl" />)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-8">
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30"><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                    <Card className="border-2">
                        <CardHeader className="bg-muted/30"><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" asChild className="-ml-4"><Link href={`/admin/products`}><ArrowLeft className="mr-2 h-4 w-4" />পণ্য তালিকায় ফিরে যান</Link></Button>
      </div>

      <Form {...form}>
        <form className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30 flex flex-row items-center justify-between space-y-0">
                            <div><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> সাধারণ তথ্য</CardTitle><CardDescription>পণ্যের নাম এবং বর্ণনা প্রদান করুন।</CardDescription></div>
                            <Button type="button" variant="secondary" size="sm" onClick={handleBeautify} disabled={isBeautifying}>{isBeautifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} Beautify Details</Button>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel className="font-bold">পণ্যের নাম</FormLabel><FormControl><Input {...field} placeholder="যেমন: হিমসাগর আম (৫ কেজি)" className="h-12 text-lg font-medium" /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="id" render={({ field }) => (
                              <FormItem>
                                <FormLabel>ইউনিক আইডি / স্লাগ (Slug)</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input {...field} placeholder="যেমন: himsagar-mango-5kg" disabled={!isNew} className="pl-8 font-mono text-sm bg-muted/20" />
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">/</span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="font-bold">সংক্ষিপ্ত বিবরণ</FormLabel><FormControl><Textarea {...field} placeholder="২-৩ লাইনে পণ্যের হাইলাইট লিখুন।" rows={3} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="story" render={({ field }) => (<FormItem><FormLabel className="font-bold">আমাদের গল্প (Our Story)</FormLabel><FormControl><Textarea {...field} placeholder="পণ্যটি সম্পর্কে কোনো বিশেষ প্রেক্ষাপট থাকলে এখানে লিখুন।" rows={3} /></FormControl><FormMessage /></FormItem>)} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> পণ্যের ছবিসমূহ</CardTitle></CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {imageFields.map((imageItemRecord, imageIndexOffset) => (
                                    <div key={imageItemRecord.id} className={cn("relative aspect-square rounded-xl overflow-hidden border-2 group", imageIndexOffset === 0 ? "border-primary ring-4 ring-primary/10" : "border-border")}>
                                        <Image src={imageItemRecord.imageUrl} alt={`Product ${imageIndexOffset + 1}`} fill className="object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                            {imageIndexOffset !== 0 && <Button type="button" variant="secondary" size="sm" className="h-8 text-[10px] rounded-full" onClick={() => form.setValue('images', [imageFields[imageIndexOffset], ...imageFields.filter((_, i) => i !== imageIndexOffset)])}><Star className="h-3 w-3 mr-1" /> থাম্বনেইল করুন</Button>}
                                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => removeImage(imageIndexOffset)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                        {imageIndexOffset === 0 && <Badge className="absolute top-2 left-2">থাম্বনেইল</Badge>}
                                    </div>
                                ))}
                                <button 
                                    type="button"
                                    onClick={() => setIsPickerOpen(true)}
                                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                                >
                                    <ImageIcon className="h-8 w-8 text-muted-foreground/40 mb-2" />
                                    <span className="text-xs font-bold text-muted-foreground">ছবি যোগ করুন</span>
                                </button>
                            </div>
                            <FormMessage className="mt-4">{form.formState.errors.images?.message}</FormMessage>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30"><CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> বিস্তারিত বিবরণ</CardTitle></CardHeader>
                        <CardContent className="pt-6"><FormField control={form.control} name="long_description" render={({ field }) => (<FormItem><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} /></CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30"><CardTitle>মূল্য এবং স্টক</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="use_variants" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/20">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-sm font-bold">একাধিক মূল্য ব্যবহার করুন</FormLabel>
                                        <FormDescription className="text-[10px]">ওজন বা সাইজ অনুযায়ী আলাদা দাম।</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={(val) => { 
                                            field.onChange(val); 
                                            if(val && variantFields.length === 0) appendVariant({ amount: '1', unitType: unitOptions[0], size: '', price: 0, stock: 0 }); 
                                        }} />
                                    </FormControl>
                                </FormItem>
                            )} />

                            {!watchedValues.use_variants ? (
                                <div className="space-y-6 animate-in fade-in">
                                    <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>বিক্রয় মূল্য (BDT)</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-11 font-bold text-lg" /></FormControl><FormMessage /></FormItem>)} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="unit" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>একক (Unit)</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="সিলেক্ট করুন" /></SelectTrigger></FormControl>
                                                    <SelectContent>{unitOptions.map(uOpt => <SelectItem key={uOpt} value={uOpt}>{uOpt}</SelectItem>)}</SelectContent>
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
                                            {variantFields.map((vVar, iIdx) => (
                                                <div key={vVar.id} className="p-3 border rounded-xl bg-card space-y-3 relative group">
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <FormField control={form.control} name={`variants.${iIdx}.amount`} render={({ field }) => (
                                                            <FormItem><FormLabel className="text-[10px] uppercase font-bold">পরিমাণ</FormLabel><FormControl><Input placeholder="১" {...field} className="h-9" /></FormControl></FormItem>
                                                        )} />
                                                        <FormField control={form.control} name={`variants.${iIdx}.unitType`} render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-[10px] uppercase font-bold">একক</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                    <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="কেজি" /></SelectTrigger></FormControl>
                                                                    <SelectContent>{unitOptions.map(uOpt => <SelectItem key={uOpt} value={uOpt}>{uOpt}</SelectItem>)}</SelectContent>
                                                                </Select>
                                                            </FormItem>
                                                        )} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <FormField control={form.control} name={`variants.${iIdx}.price`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">মূল্য</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-9 font-bold" /></FormControl></FormItem>)} />
                                                        <FormField control={form.control} name={`variants.${iIdx}.stock`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">স্টক</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>)} />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVariant(iIdx)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => appendVariant({ amount: '1', unitType: unitOptions[0], size: '', price: 0, stock: 0 })}><Plus className="mr-2 h-4 w-4" /> নতুন ওজন যোগ করুন</Button>
                                        </TabsContent>

                                        <TabsContent value="size" className="space-y-4 mt-4">
                                            {variantFields.map((vVar, iIdx) => (
                                                <div key={vVar.id} className="p-3 border rounded-xl bg-card space-y-3 relative group">
                                                    <FormField control={form.control} name={`variants.${iIdx}.size`} render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[10px] uppercase font-bold">সাইজ</FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                                                <FormControl><SelectTrigger className="h-9"><SelectValue placeholder="সিলেক্ট সাইজ" /></SelectTrigger></FormControl>
                                                                <SelectContent>{sizeOptions.map(sOpt => <SelectItem key={sOpt} value={sOpt}>{sOpt}</SelectItem>)}</SelectContent>
                                                            </Select>
                                                        </FormItem>
                                                    )} />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <FormField control={form.control} name={`variants.${iIdx}.price`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">মূল্য</FormLabel><FormControl><Input type="number" step="0.01" {...field} className="h-9 font-bold" /></FormControl></FormItem>)} />
                                                        <FormField control={form.control} name={`variants.${iIdx}.stock`} render={({ field }) => (<FormItem><FormLabel className="text-[10px] uppercase font-bold">স্টক</FormLabel><FormControl><Input type="number" {...field} className="h-9" /></FormControl></FormItem>)} />
                                                    </div>
                                                    <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeVariant(iIdx)}><X className="h-3 w-3" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" className="w-full border-dashed" onClick={() => appendVariant({ amount: '', unitType: '', size: sizeOptions[0], price: 0, stock: 0 })}><Plus className="mr-2 h-4 w-4" /> নতুন সাইজ যোগ করুন</Button>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="bg-muted/30"><CardTitle>ক্যাটাগরি এবং ফিল্টার</CardTitle></CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <FormField control={form.control} name="is_featured" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-xl border-2 border-primary/20 p-4 bg-primary/5 shadow-sm">
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="h-4 w-4 text-primary" />
                                            <FormLabel className="text-base font-bold">ফিচারড প্রোডাক্ট (Featured)</FormLabel>
                                        </div>
                                        <FormDescription className="text-xs">এটি অন করলে পণ্যটি স্টোরফ্রন্টের ফিচারড সেকশনে দেখাবে।</FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="categories" render={({ field }) => (<FormItem><FormLabel>ক্যাটাগরি সিলেক্ট করুন</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full h-11 justify-between font-normal"><span className="truncate">{field.value?.length ? field.value.join(', ') : "সিলেক্ট করুন"}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{categories.map((catRecord) => (<DropdownMenuCheckboxItem key={catRecord.id} checked={field.value?.includes(catRecord.name)} onCheckedChange={(checked) => field.onChange(checked ? [...(field.value || []), catRecord.name] : (field.value || []).filter((vItem) => vItem !== catRecord.name))}>{catRecord.name}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu></FormItem>)} />
                            
                            <FormField control={form.control} name="tags" render={({ field }) => {
                                const currentTags = Array.isArray(field.value) ? field.value : [];
                                return (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><TagsIcon className="h-4 w-4" /> ট্যাগ যোগ করুন (Tags)</FormLabel>
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2 min-h-10 p-2 border-2 rounded-xl bg-muted/10 border-dashed">
                                            {currentTags.map((tagVal) => (
                                                <Badge key={tagVal} className="gap-1.5 py-1 px-3 bg-primary text-primary-foreground">
                                                    {tagVal}
                                                    <X className="h-3 w-3 cursor-pointer hover:text-white/80" onClick={() => handleRemoveTag(tagVal, currentTags, field.onChange)} />
                                                </Badge>
                                            ))}
                                            {currentTags.length === 0 && <span className="text-xs text-muted-foreground self-center px-2">কোনো ট্যাগ যোগ করা হয়নি</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="relative flex-grow">
                                                <Input 
                                                    placeholder="নতুন ট্যাগ লিখুন..." 
                                                    value={tagInput} 
                                                    onChange={(e) => setTagInput(e.target.value)} 
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleAddTag(tagInput.trim(), currentTags, field.onChange);
                                                        }
                                                    }}
                                                    className="h-11 pr-10"
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground"
                                                    onClick={() => handleAddTag(tagInput.trim(), currentTags, field.onChange)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-11 w-11 shrink-0"><ChevronDown className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 max-h-60 overflow-y-auto">
                                                    <div className="p-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b">বিদ্যমান ট্যাগসমূহ</div>
                                                    {tagOptions.length > 0 ? tagOptions.map(tOpt => (
                                                        <DropdownMenuCheckboxItem 
                                                            key={tOpt} 
                                                            checked={currentTags.includes(tOpt)} 
                                                            onCheckedChange={(checked) => field.onChange(checked ? [...currentTags, tOpt] : currentTags.filter((vItem: string) => vItem !== tOpt))}
                                                        >
                                                            {tOpt}
                                                        </DropdownMenuCheckboxItem>
                                                    )) : <div className="p-4 text-xs text-muted-foreground text-center italic">কোনো ট্যাগ পাওয়া যায়নি</div>}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <FormDescription className="text-[10px]">ট্যাগ লিখে Enter চাপুন অথবা ড্রপডাউন থেকে সিলেক্ট করুন।</FormDescription>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}} />

                            <FormField control={form.control} name="origin" render={({ field }) => (<FormItem><FormLabel>উৎপত্তি স্থল (Origin)</FormLabel><FormControl><Input {...field} placeholder="যেমন: রাজশাহী, খুলনা" className="h-11" /></FormControl></FormItem>)} />
                            <div className="space-y-4">
                                {(['brand', 'color'] as const).map((attrNameString) => (
                                    <FormField key={attrNameString} control={form.control} name={attrNameString as any} render={({ field: attrFormField }) => {
                                        const currentSelections = Array.isArray(attrFormField.value) ? attrFormField.value : [];
                                        return (
                                        <FormItem>
                                            <FormLabel className="capitalize">{attrNameString}</FormLabel>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" className="w-full h-11 justify-between font-normal">
                                                        <span className="truncate">{currentSelections.length ? currentSelections.join(', ') : `সিলেক্ট ${attrNameString}`}</span>
                                                        <ChevronDown className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                                    {(groupedAttributes[attrNameString] || []).map((optVal) => (
                                                        <DropdownMenuCheckboxItem key={optVal} checked={currentSelections.includes(optVal)} onCheckedChange={(checked) => attrFormField.onChange(checked ? [...currentSelections, optVal] : currentSelections.filter((vItem: string) => vItem !== optVal))}>
                                                            {optVal}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </FormItem>
                                    )}} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 z-[100] md:left-[220px] lg:left-[280px] shadow-[0_-10px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-500">
                <div className="container max-w-5xl mx-auto flex flex-row justify-end items-center gap-3">
                    <Button type="button" variant="outline" onClick={() => router.push('/admin/products')} className="flex-1 sm:flex-none sm:min-w-[120px] h-11 sm:h-12 rounded-xl text-sm sm:text-base whitespace-nowrap">বাতিল করুন</Button>
                    <Button 
                        type="button" 
                        variant="secondary"
                        disabled={isSubmitting || isLimitReached} 
                        onClick={form.handleSubmit(data => onSubmit(data, false))}
                        className="flex-1 sm:flex-none sm:min-w-[120px] h-11 sm:h-12 rounded-xl font-bold text-sm sm:text-base whitespace-nowrap"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        সংরক্ষণ করুন
                    </Button>
                    <Button 
                        type="button" 
                        disabled={isSubmitting || isLimitReached} 
                        onClick={form.handleSubmit(data => onSubmit(data, true))}
                        className="flex-[2] sm:flex-none sm:min-w-[200px] h-11 sm:h-12 rounded-xl shadow-lg shadow-primary/20 font-bold text-sm sm:text-lg whitespace-nowrap"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> সেভ হচ্ছে...</>
                        ) : (
                            <><CheckCircle2 className="mr-2 h-5 w-5" /> {isNew ? 'তৈরি করে বের হোন' : 'সেভ করে বের হোন'}</>
                        )}
                    </Button>
                </div>
            </div>
        </form>
      </Form>

      {/* Raw Tailwind Image Picker Dialog */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsPickerOpen(false)} />
            <div className="relative w-full max-w-4xl bg-background rounded-[2.5rem] shadow-2xl border-2 border-primary/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <ImageIcon className="h-6 w-6 text-primary" /> ছবি নির্বাচন করুন
                        </h2>
                        <p className="text-xs text-muted-foreground">গ্যালারি থেকে সিলেক্ট করুন অথবা নতুন ছবি আপলোড করুন।</p>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsPickerOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-6 flex flex-col gap-6 flex-grow overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="relative flex-grow w-full sm:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="ছবির নাম দিয়ে খুঁজুন..." 
                                className="pl-10 h-11 rounded-xl"
                                value={pickerSearch}
                                onChange={(e) => { setPickerSearch(e.target.value); setPickerPage(1); }}
                            />
                        </div>
                        <ImageUploader multiple onUpload={handlePickerUploadSuccess} label="নতুন আপলোড" />
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2">
                        {paginatedGallery.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {paginatedGallery.map((img) => {
                                    const isSelected = (watchedValues.images || []).some(i => i.imageUrl === img.url);
                                    return (
                                        <div 
                                            key={img.id} 
                                            onClick={() => handlePickerImageSelect(img.url)}
                                            className={cn(
                                                "relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group",
                                                isSelected ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-primary/40"
                                            )}
                                        >
                                            <Image src={img.url} alt={img.name || 'Gallery Image'} fill className="object-cover transition-transform group-hover:scale-110" />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                                                        <Check className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <p className="text-[10px] text-white truncate text-center">{img.name}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                                <ImageIcon className="h-12 w-12 opacity-20 mb-4" />
                                <p className="text-sm font-bold">কোনো ছবি পাওয়া যায়নি</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg" 
                            disabled={pickerPage === 1}
                            onClick={() => setPickerPage(p => p - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-xs font-bold px-3 py-1 bg-background rounded-md border">
                            পৃষ্ঠা {pickerPage} / {totalPickerPages || 1}
                        </span>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-9 w-9 rounded-lg" 
                            disabled={pickerPage >= totalPickerPages}
                            onClick={() => setPickerPage(p => p + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <p className="text-xs text-muted-foreground hidden sm:block">
                            {(watchedValues.images || []).length}টি ছবি সিলেক্ট করা আছে
                        </p>
                        <Button className="flex-1 sm:flex-none h-11 px-8 rounded-xl font-bold" onClick={() => setIsPickerOpen(false)}>
                            সম্পন্ন করুন
                        </Button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
