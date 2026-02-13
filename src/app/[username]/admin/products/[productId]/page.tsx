
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
import { Loader2, ArrowLeft, Trash2, ChevronDown, Star, Calendar as CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import type { Product, ProductAttribute } from '@/types';
import ImageUploader from '@/components/image-uploader';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/rich-text-editor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const productFormSchema = z.object({
  id: z
    .string()
    .min(3, 'ID/Slug must be at least 3 characters.')
    .regex(
      /^[a-z0-9-]+$/,
      'ID/Slug can only contain lowercase letters, numbers, and hyphens.'
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
  brand: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  size: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
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
    (a) => (String(a) === '' || a === null ? undefined : parseFloat(String(a))),
    z.number().positive('Discount price must be a positive number.').optional()
  ),
  flash_deal_range: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
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
        if (!data.flash_deal_range?.from || !data.flash_deal_range?.to) {
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'unavailable' | 'empty' | 'invalid'>('empty');
  
  const isSubscriptionPending =
    user?.subscription_status === 'pending' ||
    user?.subscription_status === 'pending_verification';

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
      brand: null,
      unit: null,
      size: null,
      weight: null,
      color: null,
      has_flash_deal: false,
      flash_deal_price: undefined,
      flash_deal_range: { from: undefined, to: undefined },
    },
  });

  const nameValue = form.watch('name');
  
  // This useEffect will automatically generate a unique slug from the product name for new products.
  useEffect(() => {
    if (!isNew || !user) return; // Only run for new products, and if user is loaded

    const generateAndCheckSlug = async (name: string) => {
      if (!name) {
        setSlugStatus('empty');
        form.setValue('id', '');
        return;
      }

      const baseSlug = name
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9\s-]/g, '') // remove special chars
        .replace(/\s+/g, '-') // replace spaces with hyphens
        .replace(/-+/g, '-') // remove consecutive hyphens
        .trim()
        .slice(0, 50); // Truncate long names
      
      if (baseSlug.length < 2) {
        setSlugStatus('empty');
        return;
      }
      
      setSlugStatus('checking');

      let finalSlug = '';
      let isUnique = false;
      let attempt = 0;

      while (!isUnique && attempt < 10) {
        const randomNumber = Math.floor(100 + Math.random() * 900); // 3-digit random number
        const candidateSlug = `${randomNumber}-${baseSlug}`;

        try {
            const { data, error } = await supabase
                .from('products')
                .select('id')
                .eq('site_id', user.id)
                .eq('id', candidateSlug)
                .maybeSingle();

            if (!data) { // If no record is found, the slug is unique
                isUnique = true;
                finalSlug = candidateSlug;
            } else {
                attempt++;
            }
        } catch (err) {
            // Stop on database error
            break;
        }
      }

      if (finalSlug) {
        form.setValue('id', finalSlug, { shouldValidate: true });
        setSlugStatus('available');
      } else {
        form.setValue('id', '', { shouldValidate: true });
        setSlugStatus('unavailable'); // Indicates we couldn't find a unique slug
        toast({
          variant: 'destructive',
          title: 'Could not generate unique slug',
          description: 'Please try a slightly different product name.',
        })
      }
    };

    const handler = setTimeout(() => {
      generateAndCheckSlug(nameValue);
    }, 750); // Debounce for 750ms

    return () => clearTimeout(handler);
  }, [nameValue, isNew, user, form, toast]);


  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const fetchProduct = useCallback(async () => {
    if (isNew || !user) return;
    
    const productPromise = supabase
      .from('products')
      .select('*')
      .match({ id: productId, site_id: user.id })
      .single();
    
    const flashDealPromise = supabase
      .from('flash_deals')
      .select('*')
      .eq('product_id', productId)
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
      brand: productData.brand || null,
      unit: productData.unit || null,
      size: productData.size || null,
      weight: productData.weight || null,
      color: productData.color || null,
      has_flash_deal: !!flashDealData,
      flash_deal_price: flashDealData?.discount_price,
      flash_deal_range: flashDealData ? {
        from: new Date(flashDealData.start_date),
        to: new Date(flashDealData.end_date)
      } : undefined,
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

  const groupedAttributes = useMemo(() => {
    return attributes.reduce((acc, attr) => {
        (acc[attr.type] = acc[attr.type] || []).push(attr.value);
        return acc;
    }, {} as Record<string, string[]>);
  }, [attributes]);
  
  useEffect(() => {
    if (!authLoading) {
      if (isNew) {
        setIsLoading(false);
      } else if (user) {
        fetchProduct();
      }
      
      if (user) {
        fetchAttributes();
      }
    }
  }, [authLoading, user, isNew, fetchProduct, fetchAttributes]);


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
    
    if (isNew && slugStatus !== 'available') {
        toast({
            variant: 'destructive',
            title: 'Invalid Slug',
            description: 'Please choose a unique, available slug for your product.'
        });
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
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .match({ id: productId, site_id: user.id });
      productError = updateError;
    }

    if (productError) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: `Failed to ${isNew ? 'create' : 'update'} product`,
        description: productError.message,
      });
      return;
    }
    
    let flashDealError;
    try {
        const { data: existingDeal } = await supabase
            .from('flash_deals')
            .select('id')
            .eq('product_id', values.id)
            .eq('site_id', user.id)
            .maybeSingle();

        if (has_flash_deal) {
            const flashDealPayload = {
                site_id: user.id,
                product_id: values.id,
                discount_price: flash_deal_price!,
                start_date: flash_deal_range!.from!.toISOString(),
                end_date: flash_deal_range!.to!.toISOString(),
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
    move(fromIndex, 0);
  };

  const handleImageUpload = (result: any) => {
    if (result.event === 'success') {
      append({ imageUrl: result.info.secure_url, imageHint: '' });
    }
  };


  if (isLoading) {
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
  
  const isButtonDisabled = isNew 
    ? isSubmitting || isSubscriptionPending || slugStatus !== 'available'
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
                                placeholder="e.g., 123-himsagar-mango"
                                disabled={isNew}
                            />
                            </FormControl>
                            <FormDescription>
                                A unique, URL-friendly identifier automatically generated from your product name.
                            </FormDescription>
                            {isNew && (
                                <div className="min-h-[20px] pt-1">
                                    {slugStatus === 'checking' && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking availability...</p>}
                                    {slugStatus === 'unavailable' && <p className="text-sm text-destructive">Could not generate a unique slug. Try a different name.</p>}
                                    {slugStatus === 'invalid' && <p className="text-sm text-destructive">Slug must be 3+ characters and can only contain lowercase letters, numbers, and hyphens.</p>}
                                    {slugStatus === 'available' && <p className="text-sm text-green-500">This slug is available!</p>}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <div className="grid md:grid-cols-3 gap-6">
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
                        <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Unit</FormLabel>
                             <Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a unit" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {(groupedAttributes.unit || []).map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger></FormControl><SelectContent><SelectItem value="__none__">None</SelectItem>{(groupedAttributes.brand || []).map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="color" render={({ field }) => ( <FormItem><FormLabel>Color</FormLabel><Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a color" /></SelectTrigger></FormControl><SelectContent><SelectItem value="__none__">None</SelectItem>{(groupedAttributes.color || []).map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size</FormLabel><Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a size" /></SelectTrigger></FormControl><SelectContent><SelectItem value="__none__">None</SelectItem>{(groupedAttributes.size || []).map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight</FormLabel><Select onValueChange={(value) => field.onChange(value === '__none__' ? null : value)} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a weight" /></SelectTrigger></FormControl><SelectContent><SelectItem value="__none__">None</SelectItem>{(groupedAttributes.weight || []).map(weight => <SelectItem key={weight} value={weight}>{weight}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        <FormField
                        control={form.control}
                        name="categories" // Represents 'tags'
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span>{field.value?.length > 0 ? `${field.value.length} selected` : 'Select tags'}</span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                                <DropdownMenuLabel>Available Tags</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {(groupedAttributes.tag || []).length > 0 ? (
                                    (groupedAttributes.tag || []).map((tag) => (
                                    <DropdownMenuCheckboxItem
                                        key={tag}
                                        checked={field.value?.includes(tag)}
                                        onCheckedChange={(checked) => {
                                        const currentValue = field.value || [];
                                        return checked
                                            ? field.onChange([...currentValue, tag])
                                            : field.onChange(currentValue?.filter((value) => value !== tag));
                                        }}
                                        onSelect={(event) => event.preventDefault()}
                                    >
                                        {tag}
                                    </DropdownMenuCheckboxItem>
                                    ))
                                ) : (
                                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No tags found. Go to the Attribute Manager to add some.
                                    </div>
                                )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
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
                                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value?.from && "text-muted-foreground")}>
                                            {field.value?.from ? (
                                            field.value.to ? (
                                                <>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>
                                            ) : (
                                                format(field.value.from, "LLL dd, y")
                                            )
                                            ) : (
                                            <span>Pick a date range</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={field.value?.from}
                                            selected={field.value as DateRange}
                                            onSelect={field.onChange}
                                            numberOfMonths={2}
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
                                  onClick={() => remove(index)}
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
