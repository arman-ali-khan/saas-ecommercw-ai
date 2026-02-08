
'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import type { Product, Category } from '@/types';
import ImageUploader from '@/components/image-uploader';
import { Checkbox } from '@/components/ui/checkbox';

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
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Price must be a positive number.')
  ),
  currency: z.string().default('BDT'),
  description: z.string().optional(),
  long_description: z.string().optional(),
  categories: z.array(z.string()).default([]),
  origin: z.string().optional(),
  story: z.string().optional(),
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
  const { user } = useAuth();

  const productId = params.productId as string;
  const username = params.username as string;
  const isNew = productId === 'new';

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      id: '',
      name: '',
      price: 0,
      currency: 'BDT',
      description: '',
      long_description: '',
      categories: [],
      origin: '',
      story: '',
      images: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'images',
  });

  useEffect(() => {
    if (isNew) {
      // For new products, the form is initialized with empty strings, so no action is needed.
      return;
    }

    if (!user) return;

    const fetchProduct = async () => {
      setIsLoading(true);
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
        router.push(`/${username}/admin/products`);
        return;
      }

      const productData = data as Product;
      setProduct(productData);

      // Sanitize data to prevent uncontrolled -> controlled component errors.
      const sanitizedData = {
        ...productData,
        description: productData.description || '',
        long_description: productData.long_description || '',
        categories: productData.categories || [],
        origin: productData.origin || '',
        story: productData.story || '',
        images: (productData.images || []).map((img) => ({
          imageUrl: img.imageUrl || '',
          imageHint: img.imageHint || '',
        })),
      };

      form.reset(sanitizedData);
      setIsLoading(false);
    };

    fetchProduct();
  }, [productId, isNew, user, router, toast, form, username]);

  useEffect(() => {
    if (!user) return;
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('site_id', user.id)
        .order('name', { ascending: true });

      if (data) {
        setCategories(data as Category[]);
      } else if (error) {
        toast({
          variant: 'destructive',
          title: 'Could not fetch categories',
          description: error.message,
        });
      }
    };
    fetchCategories();
  }, [user, toast]);

  const onSubmit = async (values: ProductFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication error' });
      return;
    }
    // Filter out any potential empty image objects before submitting
    const finalValues = {
      ...values,
      images: values.images.filter((img) => img.imageUrl),
    };

    setIsSubmitting(true);
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

    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: `Failed to ${isNew ? 'create' : 'update'} product`,
        description: error.message,
      });
    } else {
      toast({ title: `Product ${isNew ? 'created' : 'updated'} successfully!` });
      router.push(`/${username}/admin/products`);
      router.refresh();
    }
  };

  const handleFeaturedImageUpload = (result: any) => {
    if (result.event === 'success') {
      const secureUrl = result.info.secure_url;
      if (fields.length > 0) {
        update(0, {
          ...(fields[0] || {}),
          imageUrl: secureUrl,
          imageHint: fields[0]?.imageHint || '',
        });
      } else {
        append({ imageUrl: secureUrl, imageHint: '' });
      }
    }
  };

  const handleAdditionalImageUpload = (result: any) => {
    if (result.event === 'success') {
      append({ imageUrl: result.info.secure_url, imageHint: '' });
    }
  };

  const featuredImage = fields.length > 0 ? fields[0] : null;

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

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href={`/${username}/admin/products`}>
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
                  name="categories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categories</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 rounded-lg border p-4">
                        {categories.length === 0 && (
                          <p className="p-4 text-sm text-muted-foreground col-span-full">
                            No categories found. Go to the Category Manager to
                            add some.
                          </p>
                        )}
                        {categories.map((category) => (
                          <FormItem
                            key={category.id}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(category.name)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  return checked
                                    ? field.onChange([
                                        ...currentValue,
                                        category.name,
                                      ])
                                    : field.onChange(
                                        currentValue?.filter(
                                          (value) => value !== category.name
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {category.name}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </div>
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
                      <Textarea
                        {...field}
                        rows={5}
                        placeholder="Detailed description for the product page."
                      />
                    </FormControl>
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

              <div className="space-y-6">
                <div className="space-y-4 rounded-lg border p-4">
                  <FormLabel>Featured Image</FormLabel>
                  <FormDescription>
                    This is the main image for your product, shown first.
                  </FormDescription>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {featuredImage && featuredImage.imageUrl ? (
                      <div className="relative h-24 w-24 shrink-0 rounded-md overflow-hidden border">
                        <Image
                          src={featuredImage.imageUrl}
                          alt="Featured Image"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-24 w-24 shrink-0 rounded-md border border-dashed flex items-center justify-center bg-muted">
                        <p className="text-xs text-muted-foreground">
                          No image
                        </p>
                      </div>
                    )}
                    <div className="flex-grow space-y-2">
                      <ImageUploader
                        onUpload={handleFeaturedImageUpload}
                        label={
                          featuredImage?.imageUrl
                            ? 'Change Image'
                            : 'Upload Featured Image'
                        }
                      />
                      {featuredImage && (
                        <FormField
                          control={form.control}
                          name={`images.0.imageHint`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="sr-only">
                                Image Hint
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="AI Image Hint (e.g., ripe mango)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border p-4">
                  <FormLabel>Additional Images</FormLabel>
                  <FormDescription>
                    Add more images to showcase your product from different
                    angles.
                  </FormDescription>

                  {fields.length > 1 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {fields.slice(1).map((field, index) => (
                        <div key={field.id} className="space-y-2">
                          <div className="relative group">
                            <div className="relative aspect-square w-full rounded-md overflow-hidden border">
                              {field.imageUrl && (
                                <Image
                                  src={field.imageUrl}
                                  alt={`Product Image ${index + 2}`}
                                  fill
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => remove(index + 1)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormField
                            control={form.control}
                            name={`images.${index + 1}.imageHint`}
                            render={({ field: hintField }) => (
                              <FormItem>
                                <FormLabel className="sr-only">
                                  Image Hint
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...hintField}
                                    placeholder="AI Image Hint"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <ImageUploader
                    onUpload={handleAdditionalImageUpload}
                    label="Add Additional Image"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting}>
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
