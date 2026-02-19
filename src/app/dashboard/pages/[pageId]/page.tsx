
'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/rich-text-editor';

const generateSlug = (title: string) => {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

const pageFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  slug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  content: z.string().optional(),
  is_published: z.boolean().default(false),
});

type PageFormData = z.infer<typeof pageFormSchema>;

export default function ManageSaasPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const pageId = params.pageId as string;
  const isNew = pageId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PageFormData>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: { title: '', slug: '', content: '', is_published: false },
  });

  const titleValue = form.watch('title');

  useEffect(() => {
    if (isNew && titleValue) {
      const slug = generateSlug(titleValue);
      form.setValue('slug', slug, { shouldValidate: true });
    }
  }, [titleValue, isNew, form]);

  const fetchPage = useCallback(async () => {
    if (isNew) return;
    setIsLoading(true);

    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'pages' }),
        });
        const result = await response.json();
        
        if (response.ok) {
            const pageData = (result.data || []).find((p: any) => p.id === pageId);
            if (!pageData) throw new Error('Page not found');

            // Fetch actual content if not in summary (or update fetch-data)
            // For now, assuming fetch-data returns full object for simplicity
            // or we'd need a specific get-page API.
            form.reset({
                title: pageData.title,
                slug: pageData.slug,
                content: typeof pageData.content === 'object' ? JSON.stringify(pageData.content) : (pageData.content || ''),
                is_published: pageData.is_published,
            });
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
        router.push(`/dashboard/pages`);
    } finally {
        setIsLoading(false);
    }
  }, [pageId, isNew, router, toast, form]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const onSubmit = async (values: PageFormData) => {
    setIsSubmitting(true);
    try {
        const payload = { 
            ...values, 
            id: isNew ? undefined : pageId,
            content: values.content ? JSON.parse(values.content) : null 
        };
        
        const response = await fetch('/api/saas/pages/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            toast({ title: `Page ${isNew ? 'created' : 'updated'} successfully!` });
            startTransition(() => {
                router.push(`/dashboard/pages`);
                router.refresh();
            });
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to save');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
        <CardContent className="space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-10 w-32" /></CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4 -ml-4"><Link href={`/dashboard/pages`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Pages</Link></Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-8">
            <Card>
              <CardHeader><CardTitle>{isNew ? 'Create New Page' : 'Edit Page'}</CardTitle><CardDescription>Fill in the details for your public-facing page.</CardDescription></CardHeader>
              <CardContent className="grid gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., About Us" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>URL Slug</FormLabel><FormControl><div className="relative"><Input {...field} placeholder="e.g., about-us" className="pl-6" disabled={!isNew} /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">/p/</span></div></FormControl><FormDescription>The unique URL path for this page. Cannot be changed after creation.</FormDescription><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Page Content</CardTitle><CardDescription>Use the rich text editor to create the content for your page.</CardDescription></CardHeader>
              <CardContent>
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <RichTextEditor value={field.value || ''} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="is_published" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Publish Page</FormLabel><FormDescription>Make this page accessible to the public at /p/{form.getValues('slug')}.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || isPending}>{(isSubmitting || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isNew ? 'Create Page' : 'Save Changes'}</Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
