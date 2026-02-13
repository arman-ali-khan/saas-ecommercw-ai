
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
import { Loader2, ArrowLeft, Trash2, ChevronDown, Star } from 'lucide-react';
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
  categories: z.array(z.string()).default([]), // This is used for tags
  origin: z.string().optional(),
  story: z.string().optional(),
  is_featured: z.boolean().default(false),
  brand: z.string().optional(),
  unit: z.string().optional(),
  size: z.string().optional(),
  weight: z.string().optional(),
  color: z.string().optional(),
  images: z
    .array(
      z.object({
        imageUrl: z.string().url('Must be a valid URL.'),
        imageHint: z.string().optional(),
      })
    )
    .min(1, 'At least one image is required.'),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function ManageProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const productId = params.productId as string;
  const isNew = productId === 'new';

  const [product, setProduct] = useState<Product | null>(null);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'unavailable' | 'empty' | 'invalid'>('empty');
  const [debouncedSlug, setDebouncedSlug] = useState('');

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
      categories: [], // tags
      origin: '',
      story: '',
      is_featured: false,
      images: [],
      brand: '',
      unit: '',
      size: '',
      weight: '',
      color: '',
    },
  });

  const slugValue = form.watch('id');

  useEffect(() => {
    if (!isNew) return;
    const handler = setTimeout(() => {
      setDebouncedSlug(slugValue);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [slugValue, isNew]);

  useEffect(() => {
    if (!isNew || !debouncedSlug || !user) {
      setSlugStatus('empty');
      return;
    }

    const checkSlugAvailability = async () => {
      const slugValidation = productFormSchema.shape.id.safeParse(debouncedSlug);
      if (!slugValidation.success) {
        setSlugStatus('invalid');
        return;
      }

      setSlugStatus('checking');

      try {
        const { data, error } = await supabase
          .from('products')
          .select('id')
          .eq('site_id', user.id)
          .eq('id', debouncedSlug)
          .single();

        if (error && error.code !== 'PGRST116') {
          setSlugStatus('unavailable');
        } else if (data) {
          setSlugStatus('unavailable');
        } else {
          setSlugStatus('available');
        }
      } catch (err) {
        setSlugStatus('unavailable');
      }
    };

    checkSlugAvailability();
  }, [debouncedSlug, isNew, user]);

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  const fetchProduct = useCallback(async () => {
    if (isNew || !user) return;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('site_id', user.id)
      .single();

    if (error || !data) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          'Product not found or you do not have permission to edit it.',
      });
      router.push(`/admin/products`);
      return;
    }

    const productData = data as Product;
    setProduct(productData);

    const sanitizedData = {
      ...productData,
      stock: productData.stock || 0,
      description: productData.description || '',
      long_description: productData.long_description || '',
      categories: productData.categories || [],
      origin: productData.origin || '',
      story: productData.story || '',
      is_featured: productData.is_featured || false,
      images: (productData.images || []).map((img) => ({
        imageUrl: img.imageUrl || '',
        imageHint: img.imageHint || '',
      })),
      brand: productData.brand || '',
      unit: productData.unit || '',
      size: productData.size || '',
      weight: productData.weight || '',
      color: productData.color || '',
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
    
    const finalValues = {
      ...values,
      images: values.images.filter((img) => img.imageUrl),
    };

    let error;

    if (isNew) {
      const payload = { ...finalValues, site_id: user.id };
      const { error: insertError } = await supabase
        .from('products')
        .insert(payload);
      error = insertError;
    } else {
      // Exclude 'id' from the update payload as it's the primary key
      const { id, ...updateData } = finalValues;
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId);
      error = updateError;
    }

    if (error) {
      setIsSubmitting(false);
      toast({
        variant: 'destructive',
        title: `Failed to ${isNew ? 'create' : 'update'} product`,
        description: error.message,
      });
    } else {
      toast({ title: `Product ${isNew ? 'created' : 'updated'} successfully!` });
      router.push(`/admin/products`);
      router.refresh();
    }
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
      <Card>
        <CardHeader>
          <CardTitle>
            {isNew ? 'Add New Product' : `Edit: ${product?.name}`}
          </CardTitle>
          <CardDescription>
            Fill in the details for your product below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product ID / Slug</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., himsagar-mango-1kg"
                        disabled={!isNew}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique, URL-friendly identifier. Cannot be changed after
                      creation.
                    </FormDescription>
                    {isNew && (
                        <div className="min-h-[20px] pt-1">
                            {slugStatus === 'checking' && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking availability...</p>}
                            {slugStatus === 'unavailable' && <p className="text-sm text-destructive">This slug is already taken.</p>}
                            {slugStatus === 'invalid' && <p className="text-sm text-destructive">Slug must be 3+ characters and can only contain lowercase letters, numbers, and hyphens.</p>}
                            {slugStatus === 'available' && <p className="text-sm text-green-500">This slug is available!</p>}
                        </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a unit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                           {(groupedAttributes.unit || []).map(unit => <SelectItem key={unit} value={unit}>{unit}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="grid md:grid-cols-3 gap-6">
                <FormField control={form.control} name="brand" render={({ field }) => ( <FormItem><FormLabel>Brand</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a brand" /></SelectTrigger></FormControl><SelectContent>{(groupedAttributes.brand || []).map(brand => <SelectItem key={brand} value={brand}>{brand}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="color" render={({ field }) => ( <FormItem><FormLabel>Color</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a color" /></SelectTrigger></FormControl><SelectContent>{(groupedAttributes.color || []).map(color => <SelectItem key={color} value={color}>{color}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="size" render={({ field }) => ( <FormItem><FormLabel>Size</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a size" /></SelectTrigger></FormControl><SelectContent>{(groupedAttributes.size || []).map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="weight" render={({ field }) => ( <FormItem><FormLabel>Weight</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Select a weight" /></SelectTrigger></FormControl><SelectContent>{(groupedAttributes.weight || []).map(weight => <SelectItem key={weight} value={weight}>{weight}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
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
        </CardContent>
      </Card>
    </div>
  );
}
