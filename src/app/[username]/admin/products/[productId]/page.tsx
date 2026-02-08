'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import type { Product } from '@/types';

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
  category: z.string().optional(),
  origin: z.string().optional(),
  story: z.string().optional(),
  images: z.array(
    z.object({
      imageUrl: z.string().url('Must be a valid URL.'),
      imageHint: z.string().optional(),
    })
  ).min(1, "At least one image is required."),
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
        category: '',
        origin: '',
        story: '',
        images: [{ imageUrl: '', imageHint: '' }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images"
  });

  useEffect(() => {
    if (isNew || !user) {
      return;
    }

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
          description: 'Product not found or you do not have permission to edit it.',
        });
        router.push(`/${username}/admin/products`);
        return;
      }
      
      const productData = data as Product;
      setProduct(productData);
      form.reset({
        ...productData,
        images: productData.images.length > 0 ? productData.images : [{ imageUrl: '', imageHint: '' }],
      });
      setIsLoading(false);
    };

    fetchProduct();
  }, [productId, isNew, user, router, toast, form, username]);

  const onSubmit = async (values: ProductFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication error' });
        return;
    }

    setIsSubmitting(true);
    const payload = { ...values, site_id: user.id };

    let error;

    if (isNew) {
        const { error: insertError } = await supabase.from('products').insert(payload);
        error = insertError;
    } else {
        const { error: updateError } = await supabase.from('products').update(payload).eq('id', productId);
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
      router.refresh(); // To reflect changes in the product list
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
          <CardTitle>{isNew ? 'Add New Product' : `Edit: ${product?.name}`}</CardTitle>
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
                      <Input {...field} placeholder="e.g., himsagar-mango-1kg" disabled={!isNew} />
                    </FormControl>
                    <FormDescription>A unique, URL-friendly identifier. Cannot be changed after creation.</FormDescription>
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
                    <FormControl><Input {...field} placeholder="e.g., হিমসাগর আম (১ কেজি)" /></FormControl>
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
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., ফল" /></FormControl>
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
                    <FormControl><Textarea {...field} rows={2} placeholder="A brief, catchy description for product cards." /></FormControl>
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
                    <FormControl><Textarea {...field} rows={5} placeholder="Detailed description for the product page."/></FormControl>
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
                        <FormControl><Input {...field} placeholder="e.g., রাজশাহী, বাংলাদেশ"/></FormControl>
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
                        <FormControl><Input {...field} placeholder="A short story about the product." /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="space-y-4">
                <FormLabel>Product Images</FormLabel>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start p-3 border rounded-md">
                        <span className="text-sm font-medium text-muted-foreground pt-2">{index + 1}.</span>
                        <div className="grid gap-2 flex-grow">
                             <FormField
                                control={form.control}
                                name={`images.${index}.imageUrl`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Image URL</FormLabel>
                                        <FormControl><Input {...field} placeholder="Image URL" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name={`images.${index}.imageHint`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Image Hint</FormLabel>
                                        <FormControl><Input {...field} placeholder="AI Image Hint (e.g., ripe mango)"/></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ imageUrl: "", imageHint: "" })}
                >
                    Add Image
                </Button>
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isNew ? 'Create Product' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
