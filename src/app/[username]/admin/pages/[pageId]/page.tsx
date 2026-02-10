
'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import type { Page } from '@/types';

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
import { Loader2, ArrowLeft, Heading2, Type, Image as ImageIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

// Helper function to generate a URL-friendly slug
const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single one
    .trim();
};

const pageFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters.')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  content: z.string().optional(), // Will be JSON content
  is_published: z.boolean().default(false),
});

type PageFormData = z.infer<typeof pageFormSchema>;

export default function ManagePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const pageId = params.pageId as string;
  const username = params.username as string;
  const isNew = pageId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PageFormData>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '[]',
      is_published: false,
    },
  });
  
  const titleValue = form.watch('title');

  // Auto-generate slug from title for new pages
  useEffect(() => {
    if (isNew && titleValue) {
      const slug = generateSlug(titleValue);
      form.setValue('slug', slug, { shouldValidate: true });
    }
  }, [titleValue, isNew, form]);


  const fetchPage = useCallback(async () => {
    if (isNew || !user) return;
    
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('site_id', user.id)
      .single();

    if (error || !data) {
      toast({ variant: 'destructive', title: 'Error', description: 'Page not found.' });
      router.push(`/${username}/admin/pages`);
      return;
    }
    
    form.reset({
        title: data.title,
        slug: data.slug,
        content: data.content ? JSON.stringify(data.content, null, 2) : '[]',
        is_published: data.is_published,
    });
    setIsLoading(false);
  }, [pageId, isNew, user, router, toast, form, username]);

  useEffect(() => {
    if (!authLoading) {
      if (isNew) {
        setIsLoading(false);
      } else {
        fetchPage();
      }
    }
  }, [authLoading, isNew, fetchPage]);
  
  const handleAddBlock = (type: 'heading' | 'paragraph' | 'image') => {
    const currentContent = form.getValues('content') || '[]';
    let blocks = [];

    try {
        const parsed = JSON.parse(currentContent);
        if (Array.isArray(parsed)) {
            blocks = parsed;
        } else if (currentContent.trim() === '') {
            blocks = [];
        } else {
            blocks = [parsed];
        }
    } catch (e) {
        if (currentContent.trim() === '') {
            blocks = [];
        } else {
            toast({
                variant: "destructive",
                title: "Invalid JSON Content",
                description: "Could not add block because the current content is not a valid JSON array.",
            });
            return;
        }
    }

    let newBlock;
    switch (type) {
        case 'heading':
            newBlock = { type: 'heading', level: 2, text: 'Your Heading' };
            break;
        case 'paragraph':
            newBlock = { type: 'paragraph', text: 'Start writing your paragraph here.' };
            break;
        case 'image':
            newBlock = { type: 'image', src: 'https://placehold.co/1200x600?text=Your+Image', alt: 'Placeholder Image' };
            break;
    }

    blocks.push(newBlock);

    form.setValue('content', JSON.stringify(blocks, null, 2), { shouldValidate: true, shouldDirty: true });
  };


  const onSubmit = async (values: PageFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication error' });
      return;
    }

    setIsSubmitting(true);
    
    let contentAsJson;
    try {
        contentAsJson = values.content ? JSON.parse(values.content) : null;
    } catch(e) {
        form.setError('content', { type: 'manual', message: 'Content must be valid JSON.'});
        setIsSubmitting(false);
        return;
    }

    const payload = { 
        ...values, 
        content: contentAsJson,
        site_id: user.id
    };

    let error;

    if (isNew) {
      const { error: insertError } = await supabase.from('pages').insert(payload);
      error = insertError;
    } else {
      const { error: updateError } = await supabase
        .from('pages')
        .update(payload)
        .eq('id', pageId);
      error = updateError;
    }

    if (error) {
        if (error.code === '23505') { // Unique constraint violation
            form.setError('slug', { type: 'manual', message: 'This slug is already in use. Please choose another.'});
        } else {
            toast({
                variant: 'destructive',
                title: `Failed to ${isNew ? 'create' : 'update'} page`,
                description: error.message,
            });
        }
    } else {
        toast({ title: `Page ${isNew ? 'created' : 'updated'} successfully!` });
        startTransition(() => {
            router.push(`/${username}/admin/pages`);
            router.refresh();
        });
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4 -ml-4">
        <Link href={`/${username}/admin/pages`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pages
        </Link>
      </Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>{isNew ? 'Create New Page' : 'Edit Page'}</CardTitle>
                <CardDescription>Fill in the details for your custom page.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., About Our Farm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL Slug</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input {...field} placeholder="e.g., about-our-farm" className="pl-20" />
                           <span className="absolute left-1 top-1/2 -translate-y-1/2 text-sm text-muted-foreground bg-muted h-8 px-2 flex items-center rounded-l-md border border-r-0 border-input">
                            /{username}/pages/
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>The unique URL path for this page.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Content</CardTitle>
                    <CardDescription>Use the toolbar to add content blocks. The content is stored as JSON.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-6">
                                <FormItem>
                                    <FormControl>
                                        <Textarea {...field} rows={25} placeholder='[&#10;  { "type": "paragraph", "text": "Hello, world!" }&#10;]' className="font-mono text-sm h-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                <div className="border-l pl-4 -ml-2">
                                    <h3 className="font-semibold text-sm mb-4 text-muted-foreground">ADD BLOCK</h3>
                                    <div className="space-y-2">
                                        <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAddBlock('heading')}>
                                            <Heading2 className="mr-2" /> Heading
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAddBlock('paragraph')}>
                                            <Type className="mr-2" /> Paragraph
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" className="w-full justify-start" onClick={() => handleAddBlock('image')}>
                                            <ImageIcon className="mr-2" /> Image
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                        />
                 </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publishing</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="is_published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Publish Page</FormLabel>
                        <FormDescription>
                          Make this page accessible to the public.
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
            
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || isPending}>
                    {(isSubmitting || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isNew ? 'Create Page' : 'Save Changes'}
                </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
