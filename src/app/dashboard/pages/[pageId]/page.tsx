'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/components/rich-text-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const pageFormSchema = z.object({
  title: z.string().min(1, 'Title required'),
  title_en: z.string().optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  content: z.string().optional(),
  content_en: z.string().optional(),
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

  const form = useForm<PageFormData>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: { title: '', title_en: '', slug: '', content: '', content_en: '', is_published: false },
  });

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
            const d = (result.data || []).find((p: any) => p.id === pageId);
            if (d) {
                form.reset({
                    title: d.title,
                    title_en: d.title_en || '',
                    slug: d.slug,
                    content: typeof d.content === 'object' ? JSON.stringify(d.content) : (d.content || ''),
                    content_en: typeof d.content_en === 'object' ? JSON.stringify(d.content_en) : (d.content_en || ''),
                    is_published: d.is_published,
                });
            }
        }
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }); }
    finally { setIsLoading(false); }
  }, [pageId, isNew, toast, form]);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const onSubmit = async (values: PageFormData) => {
    setIsSubmitting(true);
    try {
        const payload = {
            ...values,
            id: isNew ? undefined : pageId,
            content: values.content ? JSON.parse(values.content) : null,
            content_en: values.content_en ? JSON.parse(values.content_en) : null
        };
        const res = await fetch('/api/saas/pages/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) { toast({ title: 'Saved!' }); router.push('/dashboard/pages'); }
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="-ml-4"><Link href={`/dashboard/pages`}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader><CardTitle>Manage SaaS Page</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} disabled={!isNew} /></FormControl></FormItem>)} />
                <Tabs defaultValue="bn">
                    <TabsList className="mb-4">
                        <TabsTrigger value="bn">Bengali Content</TabsTrigger>
                        <TabsTrigger value="en">English Content</TabsTrigger>
                    </TabsList>
                    <TabsContent value="bn" className="space-y-6">
                        <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title (BN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Content (BN)</FormLabel><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl></FormItem>)} />
                    </TabsContent>
                    <TabsContent value="en" className="space-y-6">
                        <FormField control={form.control} name="title_en" render={({ field }) => (<FormItem><FormLabel>Title (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                        <FormField control={form.control} name="content_en" render={({ field }) => (<FormItem><FormLabel>Content (EN)</FormLabel><FormControl><RichTextEditor value={field.value || ''} onChange={field.onChange} /></FormControl></FormItem>)} />
                    </TabsContent>
                </Tabs>
                <FormField control={form.control} name="is_published" render={({ field }) => (<FormItem className="flex items-center justify-between p-4 border rounded-xl"><FormLabel>Publish</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save Page</Button>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}