
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
import { Loader2, ArrowLeft, Trash2, ChevronDown, Star, PackageCheck, Ban, CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
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

const productFormSchema = z.object({
  id: z
    .string()
    .min(3, 'ID/Slug must be at least 3 characters.')
    .regex(
      /^[a-z0-9\u0980-\u09FF-]+$/,
      'Slug can only contain lowercase letters, numbers, hyphens, and Bengali characters.'
    ),
  name: z.string().min(1, 'Name is required.'),
  price: z.preprocess(
    (a) => parseFloat(String(a)),
    z.number().positive('Price must be a positive number.')
  ),
  stock: z.preprocess(
    (a) => parseInt(String(a), 10),
    z.number().min(0, "Stock can't be negative.").default(0)
  ),
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
  images: z
    .array(
      z.object({
        imageUrl: z.string().url('Must be a valid URL.'),
        imageHint: z.string().optional(),
      })
    )
    .min(1, 'At least one image is required.'),
  has_flash_deal: z.boolean().default(false),
  flash_deal_price: z.preprocess(
    (val) => (val === '' || val == null ? undefined : parseFloat(String(val))),
    z.number().positive('Discount price must be a positive number.').optional()
  ),
  flash_deal_range: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  }).optional(),
}).superRefine((data, ctx) => {
    if (data.has_flash_deal) {
        if (!data.flash_deal_price || data.flash_deal_price <= 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Discount price is required and must be positive.",
            path: ['flash_deal_price'],
        });
        }
        if (!data.flash_deal_range?.startDate || !data.flash_deal_range?.endDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "A start and end date for the deal are required.",
            path: ['flash_deal_range'],
        });
        }
        if (data.flash_deal_price && data.price && data.flash_deal_price >= data.price) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Discount price must be less than the regular price.",
                path: ['flash_deal_price'],
            });
        }
    }
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ManageProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const productId = params.productId as string;
  const isNew = productId === 'new';

  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productCount, setProductCount] = useState(0);
  const [isLoadingProductCount, setIsLoadingProductCount] = useState(!isNew);
  
  const isSubscriptionPending =
    user?.subscription_status === 'pending' ||
    user?.subscription_status === 'pending_verification';

  const isSubscriptionExpired = useMemo(() => {
    if (!user?.subscription_end_date) return false;
    const now = new Date();
    const endDate = new Date(user.subscription_end_date);
    return isBefore(endDate, now);
  }, [user?.subscription_end_date]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: '',
      name: '',
      price: 0,
      stock: 0,
      currency: 'BDT',
      description: '',
      long_description: '',
      categories: [],
      origin: '',
      story: '',
      is_featured: false,
      images: [],
      brand: [],
      unit: [],
      size: [],
      color: [],
      has_flash_deal: false,
      flash_deal_price: undefined,
      flash_deal_range: { startDate: undefined, endDate: undefined },
    },
  });

  const nameValue = form.watch('name');
  
  useEffect(() => {
    if (isNew && nameValue) {
      const slug = nameValue
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      form.setValue('id', `${slug}-${Math.random().toString(36).substring(2, 7)}`, { shouldValidate: true });
    }
  }, [nameValue, isNew, form]);


  const { fields, append, remove, swap } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const fetchProduct = useCallback(async () => {
    if (isNew || !user) return;
    
    const decodedProductId = decodeURIComponent(productId);
    
    const productPromise = supabase
      .from('products')
      .select('*')
      .match({ id: decodedProductId, site_id: user.id })
      .single();
    
    const flashDealPromise = supabase
      .from('flash_deals')
      .select('*')
      .eq('product_id', decodedProductId)
      .eq('site_id', user.id)
      .single();

    const [{ data: productData, error }, { data: flashDealData }] = await Promise.all([productPromise, flashDealPromise]);


    if (error || !productData) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Product not found or you do not have permission to edit it.',
      });
      router.push(`/admin/products`);
      return;
    }
    
    const sanitizedData = {
      ...productData,
      stock: productData.stock || 0,
      description: productData.description || '',
      long_description: productData.long_description || '',
      categories: productData.categories || [],
      origin: productData.origin || '',
      story: productData.story || '',
      is_featured: productData.is_featured || false,
      images: (productData.images || []).map((img: any) => ({
        imageUrl: img.imageUrl || '',
        imageHint: img.imageHint || '',
      })),
      brand: productData.brand || [],
      unit: productData.unit || [],
      size: productData.size || [],
      color: productData.color || [],
      has_flash_deal: !!flashDealData,
      flash_deal_price: flashDealData?.discount_price,
      flash_deal_range: flashDealData ? {
        startDate: new Date(flashDealData.start_date),
        endDate: new Date(flashDealData.end_date)
      } : { startDate: undefined, endDate: undefined },
    };

    form.reset(sanitizedData);
    setIsLoading(false);
  }, [productId, isNew, user, router, toast, form]);
  
  const fetchAttributes = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('product_attributes').select('*').eq('site_id', user.id);
    if(error) {
        toast({ title: 'Error fetching attributes', variant: 'destructive', description: error.message });
    } else if (data) {
        setAttributes(data);
    }
  }, [user, toast]);
  
  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('categories').select('*').eq('site_id', user.id);
    if(error) {
        toast({ title: 'Error fetching categories', variant: 'destructive', description: error.message });
    } else if (data) {
        setCategories(data as Category[]);
    }
  }, [user, toast]);

  const groupedAttributes = useMemo(() => {
    return attributes.reduce((acc, attr) => {
        (acc[attr.type] = acc[attr.type] || []).push(attr.value);
        return acc;
    }, {} as Record<string, string[]>);
  }, [attributes]);
  
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchAttributes();
        fetchCategories();
        if (isNew) {
          setIsLoading(false);
          setIsLoadingProductCount(true);
          supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('site_id', user.id)
            .then(({ count }) => {
              setProductCount(count || 0);
              setIsLoadingProductCount(false);
            });
        } else {
           fetchProduct();
           setIsLoadingProductCount(false);
        }
      }
    }
  }, [authLoading, user, isNew, fetchProduct, fetchAttributes, fetchCategories]);


  const onSubmit = async (values: ProductFormData) => {
    if (isSubscriptionPending) {
      toast({
        variant: 'destructive',
        title: 'Action Disabled',
        description: 'Your subscription is pending approval. You cannot create products.',
      });
      return;
    }

    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication error' });
      return;
    }
    
    setIsSubmitting(true);
    
    const { has_flash_deal, flash_deal_price, flash_deal_range, ...productValues } = values;

    const finalProductValues = {
      ...productValues,
      images: productValues.images.filter((img) => img.imageUrl),
    };

    let productError;

    if (isNew) {
      const payload = { ...finalProductValues, site_id: user.id };
      const { error: insertError } = await supabase
        .from('products')
        .insert(payload);
      productError = insertError;
    } else {
      const { id, ...updateData } = finalProductValues;
      const decodedProductId = decodeURIComponent(productId);
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .match({ id: decodedProductId, site_id: user.id });
      productError = updateError;
    }

    if (productError) {
      setIsSubmitting(false);
      if (productError.code === '23505') { // Unique constraint violation
        form.setError('id', { type: 'manual', message: 'This Product ID/Slug is already taken. Please choose another.' });
        toast({ variant: 'destructive', title: 'Product ID already exists', description: 'Please choose a unique Product ID / Slug.' });
      } else {
        toast({
          variant: 'destructive',
          title: `Failed to ${isNew ? 'create' : 'update'} product`,
          description: productError.message,
        });
      }
      return;
    }
    
    let flashDealError;
    try {
        const decodedProductId = decodeURIComponent(productId);
        const { data: existingDeal } = await supabase
            .from('flash_deals')
            .select('id')
            .eq('product_id', isNew ? values.id : decodedProductId)
            .eq('site_id', user.id)
            .maybeSingle();

        if (has_flash_deal) {
            const flashDealPayload = {
                site_id: user.id,
                product_id: isNew ? values.id : decodedProductId,
                discount_price: flash_deal_price!,
                start_date: flash_deal_range!.startDate!.toISOString(),
                end_date: flash_deal_range!.endDate!.toISOString(),
                is_active: true,
            };
            if (existingDeal) {
                const { error } = await supabase.from('flash_deals').update(flashDealPayload).eq('id', existingDeal.id);
                flashDealError = error;
            } else {
                const { error } = await supabase.from('flash_deals').insert(flashDealPayload);
                flashDealError = error;
            }
        } else if (existingDeal) {
            const { error } = await supabase.from('flash_deals').delete().eq('id', existingDeal.id);
            flashDealError = error;
        }

    } catch (e: any) {
        flashDealError = e;
    }

    if (flashDealError) {
        setIsSubmitting(false);
        toast({
            variant: 'destructive',
            title: `Failed to update flash deal`,
            description: flashDealError.message,
        });
        return;
    }

    toast({ title: `Product ${isNew ? 'created' : 'updated'} successfully!` });
    router.push(`/admin/products`);
    router.refresh();
  };

  const handleSetFeatured = (fromIndex: number) => {
    if (fromIndex === 0) return;
    swap(0, fromIndex);
    toast({ title: 'Featured image updated.', description: 'Click "Save Changes" to apply.' });
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    if (fields.length <= 1) {
      form.setError('images', { type: 'manual', message: 'At least one image is required.' });
      return;
    }
    remove(indexToRemove);
  };

  const handleImageUpload = (result: any) => {
    if (result.event === 'success') {
      append({ imageUrl: result.info.secure_url, imageHint: '' });
    }
  };


  if (isLoading || isLoadingProductCount) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  const productLimit = user?.product_limit;
  const isLimitReached = productLimit !== null && productCount >= productLimit;
  
  if (isNew && isLimitReached && !isSubscriptionExpired) {
    return (
        <div>
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href={`/admin/products`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
                </Link>
            </Button>
            <Alert variant="destructive">
                <PackageCheck className="h-4 w-4" />
                <AlertTitle>Product Limit Reached</AlertTitle>
                <AlertDescription>
                    You have reached your limit of {productLimit} products for the current plan. Please upgrade your subscription to add more products.
                    <Button asChild className="mt-4 block w-fit">
                        <Link href="/admin/settings">Manage Subscription</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    )
  }

  if (isNew && isSubscriptionExpired) {
    return (
        <div>
            <Button variant="ghost" asChild className="mb-4 -ml-4">
                <Link href={`/admin/products`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
                </Link>
            </Button>
            <Alert variant="destructive">
                <Ban className="h-4 w-4" />
                <AlertTitle>Subscription Expired</AlertTitle>
                <AlertDescription>
                    Your subscription has expired. You cannot create new products. Please renew your subscription to add more.
                    <Button asChild className="mt-4 block w-fit">
                        <Link href="/admin/settings">Manage Subscription</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        </div>
    )
  }
  
  const isButtonDisabled = isNew 
    ? isSubmitting || isSubscriptionPending || isLimitReached || isSubscriptionExpired
    : isSubmitting || isSubscriptionPending;

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href={`/admin/products`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Link>
      </Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
                <CardHeader>
                <CardTitle>
                    {isNew ? 'Add New Product' : `Edit: ${form.getValues('name')}`}
                </CardTitle>
                <CardDescription>
                    Fill in the details for your product below.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product Name</FormLabel>
                            <FormControl>
                            <Input
                                {...field}
                                placeholder="e.g., হিমসাগর আম (১ কেজি)"
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="id"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Product ID / Slug</FormLabel>
                            <FormControl>
                            <Input
                                {...field}
                                placeholder="e.g., himsagar-mango"
                                disabled={!isNew}
                            />
                            </FormControl>
                            <FormDescription>
                                A unique, URL-friendly identifier. Auto-generated from name for new products.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                                <Input type="number" step="1" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    
                    <FormField
                        control={form.control}
                        name="categories"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categories</FormLabel>
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between font-normal">
                                <span className="truncate pr-2">
                                    {field.value?.length ? field.value.join(', ') : "Select categories"}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                {categories.map((cat) => (
                                <DropdownMenuCheckboxItem
                                    key={cat.id}
                                    checked={field.value?.includes(cat.name)}
                                    onCheckedChange={(checked) => {
                                    const currentValues = field.value || [];
                                    return checked
                                        ? field.onChange([...currentValues, cat.name])
                                        : field.onChange(currentValues.filter((value) => value !== cat.name));
                                    }}
                                >
                                    {cat.name}
                                </DropdownMenuCheckboxItem>
                                ))}
                                {categories.length === 0 && <div className="p-2 text-sm text-muted-foreground">No categories found. Create them in the Category Manager.</div>}
                            </DropdownMenuContent>
                            </DropdownMenu>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormField control={form.control} name="brand" render={({ field }) => (<FormItem><FormLabel>Brands</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate pr-2">{field.value?.length ? field.value.join(', ') : "Select brands"}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{(groupedAttributes.brand || []).map((option) => (<DropdownMenuCheckboxItem key={option} checked={field.value?.includes(option)} onCheckedChange={(checked) => { const currentValues = field.value || []; return checked ? field.onChange([...currentValues, option]) : field.onChange(currentValues.filter((value: string) => value !== option)); }}>{option}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="color" render={({ field }) => (<FormItem><FormLabel>Colors</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate pr-2">{field.value?.length ? field.value.join(', ') : "Select colors"}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{(groupedAttributes.color || []).map((option) => (<DropdownMenuCheckboxItem key={option} checked={field.value?.includes(option)} onCheckedChange={(checked) => { const currentValues = field.value || []; return checked ? field.onChange([...currentValues, option]) : field.onChange(currentValues.filter((value: string) => value !== option)); }}>{option}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="size" render={({ field }) => (<FormItem><FormLabel>Sizes</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate pr-2">{field.value?.length ? field.value.join(', ') : "Select sizes"}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{(groupedAttributes.size || []).map((option) => (<DropdownMenuCheckboxItem key={option} checked={field.value?.includes(option)} onCheckedChange={(checked) => { const currentValues = field.value || []; return checked ? field.onChange([...currentValues, option]) : field.onChange(currentValues.filter((value: string) => value !== option)); }}>{option}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="unit" render={({ field }) => (<FormItem><FormLabel>Units</FormLabel><DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="w-full justify-between font-normal"><span className="truncate pr-2">{field.value?.length ? field.value.join(', ') : "Select units"}</span><ChevronDown className="h-4 w-4 opacity-50" /></Button></DropdownMenuTrigger><DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">{(groupedAttributes.unit || []).map((option) => (<DropdownMenuCheckboxItem key={option} checked={field.value?.includes(option)} onCheckedChange={(checked) => { const currentValues = field.value || []; return checked ? field.onChange([...currentValues, option]) : field.onChange(currentValues.filter((value: string) => value !== option)); }}>{option}</DropdownMenuCheckboxItem>))}</DropdownMenuContent></DropdownMenu><FormMessage /></FormItem>)} />
                    </div>

                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Short Description</FormLabel>
                            <FormControl>
                            <Textarea
                                {...field}
                                rows={2}
                                placeholder="A brief, catchy description for product cards."
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="long_description"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Long Description</FormLabel>
                            <FormControl>
                            <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                            </FormControl>
                            <FormDescription>
                            Use the rich text editor for detailed product information.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                        control={form.control}
                        name="origin"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Origin</FormLabel>
                            <FormControl>
                                <Input
                                {...field}
                                placeholder="e.g., রাজশাহী, বাংলাদেশ"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="story"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Story</FormLabel>
                            <FormControl>
                                <Input
                                {...field}
                                placeholder="A short story about the product."
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Flash Deal</CardTitle>
                    <CardDescription>
                        Create a limited-time discount for this product.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="has_flash_deal"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <FormLabel className="text-base">Enable Flash Deal</FormLabel>
                                    <FormDescription>
                                        Turn this on to set a special discounted price for a limited time.
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
                    {form.watch('has_flash_deal') && (
                        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="flash_deal_price"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Discount Price</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="flash_deal_range"
                                render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Deal Duration</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    id="date"
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value?.startDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {field.value?.startDate && field.value?.endDate ? (
                                                        <>
                                                            {format(field.value.startDate, "LLL dd, y")} -{" "}
                                                            {format(field.value.endDate, "LLL dd, y")}
                                                        </>
                                                    ) : (
                                                        <span>Pick a date range</span>
                                                    )}
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={field.value?.startDate}
                                                selected={{ from: field.value?.startDate, to: field.value?.endDate }}
                                                onSelect={(range) => field.onChange({ startDate: range?.from, endDate: range?.to })}
                                                numberOfMonths={1}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent>
                     <FormField
                        control={form.control}
                        name="is_featured"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                            <FormLabel className="text-base">
                                Featured Product
                            </FormLabel>
                            <FormDescription>
                                Display this product on the homepage's featured section.
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                    <CardDescription>
                        Upload images for your product. The first image in the list will be the featured image.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="images"
                        render={() => (
                            <FormItem>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {fields.map((field, index) => (
                                    <div key={field.id} className="space-y-2">
                                        <Card className="overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="relative group aspect-square w-full">
                                            {field.imageUrl ? (
                                                <Image
                                                src={field.imageUrl}
                                                alt={`Product Image ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-muted">
                                                <p className="text-xs text-muted-foreground">No image</p>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {index > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleSetFeatured(index)}
                                                    title="Set as featured"
                                                >
                                                    <Star className="h-4 w-4" />
                                                </Button>
                                                )}
                                                <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleRemoveImage(index)}
                                                title="Delete image"
                                                >
                                                <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {index === 0 && (
                                                <Badge className="absolute top-2 left-2">
                                                Featured
                                                </Badge>
                                            )}
                                            </div>
                                        </CardContent>
                                        </Card>

                                        <FormField
                                        control={form.control}
                                        name={`images.${index}.imageHint`}
                                        render={({ field: hintField }) => (
                                            <FormItem>
                                            <FormLabel className="sr-only">Image Hint</FormLabel>
                                            <FormControl>
                                                <Input {...hintField} placeholder="AI Image Hint" />
                                            </FormControl>
                                            <FormMessage />
                                            </FormItem>
                                        )}
                                        />
                                    </div>
                                    ))}
                                </div>
                                <FormMessage className="pt-2" />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <ImageUploader
                    onUpload={handleImageUpload}
                    label="Upload Images"
                    multiple={true}
                    />
                </CardFooter>
            </Card>
              
              <Button type="submit" disabled={isButtonDisabled}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isNew ? 'Create Product' : 'Save Changes'}
              </Button>
            </form>
          </Form>
    </div>
  );
}
