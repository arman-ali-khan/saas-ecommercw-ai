
'use client';

import { useEffect, useState, useCallback, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';
import type { Page } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Heading2, Type, Image as ImageIcon, Link as LinkIcon, Youtube, Trash2, ArrowUp, ArrowDown, GripVertical, Palette, Columns, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploader from '@/components/image-uploader';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';

const generateSlug = (title: string) => {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
};

const blockBaseSchema = z.object({
  id: z.string(),
});

const headingBlockSchema = blockBaseSchema.extend({
  type: z.literal('heading'),
  level: z.number().min(1).max(3).default(2),
  text: z.string().min(1, 'Heading text cannot be empty.'),
  align: z.enum(['left', 'center', 'right']).default('left'),
});

const paragraphBlockSchema = blockBaseSchema.extend({
  type: z.literal('paragraph'),
  text: z.string().min(1, 'Paragraph text cannot be empty.'),
  align: z.enum(['left', 'center', 'right']).default('left'),
});

const imageBlockSchema = blockBaseSchema.extend({
  type: z.literal('image'),
  src: z.string().url('Image source must be a valid URL.'),
  alt: z.string().optional(),
});

const buttonBlockSchema = blockBaseSchema.extend({
  type: z.literal('button'),
  text: z.string().min(1, 'Button text is required.'),
  href: z.string().min(1, 'Button link is required.'),
  variant: z.enum(['default', 'secondary', 'outline', 'ghost', 'link']).default('default'),
});

const youtubeBlockSchema = blockBaseSchema.extend({
  type: z.literal('youtube'),
  videoId: z.string().min(1, 'YouTube Video ID is required.'),
});

const coloredBoxBlockSchema = blockBaseSchema.extend({
    type: z.literal('coloredBox'),
    color: z.string().optional().default('hsl(var(--card))'),
    text: z.string().min(1, 'Text cannot be empty.')
});

// Recursive schema definitions for layout blocks
const baseBlockSchema: z.ZodType<any> = z.lazy(() => blockSchema);

const columnSchema = z.object({
    id: z.string(),
    blocks: z.array(baseBlockSchema)
});

const layoutBlockSchema = blockBaseSchema.extend({
    type: z.literal('layout'),
    columnCount: z.number().min(1).max(3),
    columns: z.array(columnSchema),
});

const blockSchema = z.discriminatedUnion('type', [
  headingBlockSchema,
  paragraphBlockSchema,
  imageBlockSchema,
  buttonBlockSchema,
  youtubeBlockSchema,
  coloredBoxBlockSchema,
  layoutBlockSchema
]);

const pageFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  slug: z.string().min(3, 'Slug must be at least 3 characters.').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  content: z.array(blockSchema).default([]),
  is_published: z.boolean().default(false),
});

type PageFormData = z.infer<typeof pageFormSchema>;

const themeColorPalette = {
    'Background': 'hsl(var(--background))',
    'Foreground': 'hsl(var(--foreground))',
    'Card': 'hsl(var(--card))',
    'Popover': 'hsl(var(--popover))',
    'Primary': 'hsl(var(--primary))',
    'Secondary': 'hsl(var(--secondary))',
    'Muted': 'hsl(var(--muted))',
    'Accent': 'hsl(var(--accent))',
    'Destructive': 'hsl(var(--destructive))',
}

const defaultColorPalette = [
    { name: 'Navy', color: '#172554' },
    { name: 'Green', color: '#064e3b' },
    { name: 'Red', color: '#7f1d1d' },
    { name: 'Amber', color: '#854d0e' },
    { name: 'Indigo', color: '#1e1b4b' },
    { name: 'Fuchsia', color: '#4a044e' },
    { name: 'Slate', color: '#334155' },
    { name: 'Stone', color: '#44403c' },
];

const BlockEditor = ({ control, namePrefix }: { control: Control<PageFormData>, namePrefix: string }) => {
    const { fields, append, remove, move } = useFieldArray({
        control,
        name: namePrefix as any,
    });

    const addBlock = (type: 'heading' | 'paragraph' | 'image' | 'button' | 'youtube' | 'coloredBox' | 'layout', columnCount?: number) => {
        const id = uuidv4();
        let newBlock: any;

        switch (type) {
            case 'heading': newBlock = { id, type: 'heading', level: 2, text: 'Your Heading', align: 'left' }; break;
            case 'paragraph': newBlock = { id, type: 'paragraph', text: 'Start writing your paragraph here.', align: 'left' }; break;
            case 'image': newBlock = { id, type: 'image', src: 'https://placehold.co/1200x600?text=Your+Image', alt: 'Placeholder Image' }; break;
            case 'button': newBlock = { id, type: 'button', text: 'Click Me', href: '#', variant: 'default' }; break;
            case 'youtube': newBlock = { id, type: 'youtube', videoId: 'dQw4w9WgXcQ' }; break;
            case 'coloredBox': newBlock = { id, type: 'coloredBox', color: 'hsl(var(--card))', text: 'This is a colored box.' }; break;
            case 'layout': newBlock = { id, type: 'layout', columnCount, columns: Array.from({ length: columnCount || 1 }, () => ({ id: uuidv4(), blocks: [] })) }; break;
        }
        append(newBlock);
    };

    return (
        <div className="space-y-4">
            {fields.map((field, index) => {
                const currentFieldName = `${namePrefix}.${index}`;
                if ((field as any).type === 'layout') {
                    const layout = field as any;
                    return (
                        <Card key={field.id} className="p-4 bg-muted/20">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><Columns className="h-5 w-5" /> Layout: <span className="capitalize text-foreground">{layout.columnCount} Column</span></div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" size="icon" variant="ghost" onClick={() => move(index, index - 1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                    <Button type="button" size="icon" variant="ghost" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                    <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </div>
                            <div className={`grid grid-cols-1 md:grid-cols-${layout.columnCount} gap-4`}>
                                {layout.columns.map((col: any, colIndex: number) => (
                                    <div key={col.id} className="bg-background/50 p-3 rounded-lg border-dashed border">
                                        <BlockEditor control={control} namePrefix={`${currentFieldName}.columns.${colIndex}.blocks`} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    );
                }
                
                // Regular block rendering
                return (
                    <Card key={field.id} className="p-4 bg-muted/20">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground"><GripVertical className="cursor-grab h-5 w-5" /> Block: <span className="capitalize text-foreground">{(field as any).type}</span></div>
                          <div className="flex items-center gap-2">
                            <Button type="button" size="icon" variant="ghost" onClick={() => move(index, index - 1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                            <Button type="button" size="icon" variant="ghost" onClick={() => move(index, index + 1)} disabled={index === fields.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div className="space-y-4">
                            {(field as any).type === 'heading' && (
                                <>
                                    <FormField control={control} name={`${currentFieldName}.text`} render={({ field: f }) => (<FormItem><FormLabel>Text</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`${currentFieldName}.align`} render={({ field: f }) => (<FormItem><FormLabel>Alignment</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="left"><AlignLeft className="inline-block mr-2 h-4 w-4"/>Left</SelectItem><SelectItem value="center"><AlignCenter className="inline-block mr-2 h-4 w-4"/>Center</SelectItem><SelectItem value="right"><AlignRight className="inline-block mr-2 h-4 w-4"/>Right</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                </>
                            )}
                            {(field as any).type === 'paragraph' && (
                                <>
                                    <FormField control={control} name={`${currentFieldName}.text`} render={({ field: f }) => (<FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...f} rows={4} /></FormControl><FormDescription>Use **bold** for bold and *italic* for italic text.</FormDescription><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`${currentFieldName}.align`} render={({ field: f }) => (<FormItem><FormLabel>Alignment</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="left"><AlignLeft className="inline-block mr-2 h-4 w-4"/>Left</SelectItem><SelectItem value="center"><AlignCenter className="inline-block mr-2 h-4 w-4"/>Center</SelectItem><SelectItem value="right"><AlignRight className="inline-block mr-2 h-4 w-4"/>Right</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                </>
                            )}
                            {(field as any).type === 'image' && (
                                <>
                                <FormField control={control} name={`${currentFieldName}.src`} render={({ field: f }) => (<FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={control} name={`${currentFieldName}.alt`} render={({ field: f }) => (<FormItem><FormLabel>Alt Text</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                                <ImageUploader onUpload={(res) => (control as any)._form.setValue(`${currentFieldName}.src`, res.info.secure_url)} />
                                </>
                            )}
                            {(field as any).type === 'button' && (
                                <>
                                    <FormField control={control} name={`${currentFieldName}.text`} render={({ field: f }) => (<FormItem><FormLabel>Button Text</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`${currentFieldName}.href`} render={({ field: f }) => (<FormItem><FormLabel>Button Link (URL)</FormLabel><FormControl><Input {...f} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`${currentFieldName}.variant`} render={({ field: f }) => (<FormItem><FormLabel>Style</FormLabel><Select onValueChange={f.onChange} defaultValue={f.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="default">Default</SelectItem><SelectItem value="secondary">Secondary</SelectItem><SelectItem value="outline">Outline</SelectItem><SelectItem value="ghost">Ghost</SelectItem><SelectItem value="link">Link</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                                </>
                            )}
                            {(field as any).type === 'youtube' && (
                                <FormField control={control} name={`${currentFieldName}.videoId`} render={({ field: f }) => (<FormItem><FormLabel>YouTube Video ID</FormLabel><FormControl><Input {...f} /></FormControl><FormDescription>From a URL like youtube.com/watch?v=VIDEO_ID</FormDescription><FormMessage /></FormItem>)} />
                            )}
                            {(field as any).type === 'coloredBox' && (
                                <>
                                    <FormField control={control} name={`${currentFieldName}.text`} render={({ field: f }) => (<FormItem><FormLabel>Text</FormLabel><FormControl><Textarea {...f} rows={3} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={control} name={`${currentFieldName}.color`} render={({ field: f }) => (<FormItem><FormLabel>Background Color</FormLabel><div className="flex items-center gap-2"><FormControl><Input {...f} placeholder="hsl(var(--card))" /></FormControl><DropdownMenu><DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon"><Palette className="h-4 w-4" /><span className="sr-only">Open color picker</span></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuLabel>Theme Colors</DropdownMenuLabel><DropdownMenuSeparator />{Object.entries(themeColorPalette).map(([name, color]) => (<DropdownMenuItem key={name} onSelect={() => (control as any)._form.setValue(`${currentFieldName}.color`, color)}><div className="h-4 w-4 rounded-full border mr-2" style={{ backgroundColor: color }}/>{name}</DropdownMenuItem>))}<DropdownMenuSeparator /><DropdownMenuLabel>Standard Palette</DropdownMenuLabel><div className="p-2 grid grid-cols-4 gap-2">{defaultColorPalette.map(({name, color}) => (<button type="button" key={name} title={name} className="h-8 w-8 rounded-md border focus:outline-none focus:ring-2 focus:ring-ring" style={{ backgroundColor: color }} onClick={() => (control as any)._form.setValue(`${currentFieldName}.color`, color)}/>))}</div></DropdownMenuContent></DropdownMenu></div><FormDescription>Enter a custom HSL/hex code, or select from the palette.</FormDescription><FormMessage /></FormItem>)} />
                                </>
                            )}
                        </div>
                    </Card>
                )
            })}
             {fields.length === 0 && <p className="text-center text-muted-foreground py-8">Add your first content block.</p>}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="secondary" className="w-full">
                        <Plus className="mr-2 h-4 w-4" /> Add Block
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64">
                    <DropdownMenuItem onSelect={() => addBlock('heading')}><Heading2 className="mr-2" /> Heading</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => addBlock('paragraph')}><Type className="mr-2" /> Paragraph</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => addBlock('image')}><ImageIcon className="mr-2" /> Image</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => addBlock('button')}><LinkIcon className="mr-2" /> Button</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => addBlock('youtube')}><Youtube className="mr-2" /> YouTube Video</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => addBlock('coloredBox')}><Palette className="mr-2" /> Colored Box</DropdownMenuItem>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger><Columns className="mr-2" /> Layout</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem onSelect={() => addBlock('layout', 1)}>1 Column</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => addBlock('layout', 2)}>2 Columns</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => addBlock('layout', 3)}>3 Columns</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};


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
    defaultValues: { title: '', slug: '', content: [], is_published: false },
  });

  const titleValue = form.watch('title');

  useEffect(() => {
    if (isNew && titleValue) {
      const slug = generateSlug(titleValue);
      form.setValue('slug', slug, { shouldValidate: true });
    }
  }, [titleValue, isNew, form]);

  const fetchPage = useCallback(async () => {
    if (isNew || !user) return;
    const { data, error } = await supabase.from('pages').select('*').eq('id', pageId).eq('site_id', user.id).single();
    if (error || !data) {
      toast({ variant: 'destructive', title: 'Error', description: 'Page not found.' });
      router.push(`/${username}/admin/pages`);
      return;
    }
    const pageData = data as Page;
    form.reset({
      title: pageData.title,
      slug: pageData.slug,
      content: (pageData.content || []).map((block: any) => ({ ...block, id: block.id || uuidv4() })),
      is_published: pageData.is_published,
    });
    setIsLoading(false);
  }, [pageId, isNew, user, router, toast, form, username]);

  useEffect(() => {
    if (!authLoading) {
      if (isNew) setIsLoading(false);
      else fetchPage();
    }
  }, [authLoading, isNew, fetchPage]);

  const onSubmit = async (values: PageFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication error' });
      return;
    }
    setIsSubmitting(true);
    const payload = { ...values, site_id: user.id };
    let error;
    if (isNew) {
      const { error: insertError } = await supabase.from('pages').insert(payload);
      error = insertError;
    } else {
      const { error: updateError } = await supabase.from('pages').update(payload).eq('id', pageId);
      error = updateError;
    }
    if (error) {
      if (error.code === '23505') {
        form.setError('slug', { type: 'manual', message: 'This slug is already in use. Please choose another.' });
      } else {
        toast({ variant: 'destructive', title: `Failed to ${isNew ? 'create' : 'update'} page`, description: error.message });
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
        <CardContent className="space-y-6"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-24 w-full" /><Skeleton className="h-10 w-32" /></CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Button variant="ghost" asChild className="mb-4 -ml-4"><Link href={`/${username}/admin/pages`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Pages</Link></Button>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-8">
            <Card>
              <CardHeader><CardTitle>{isNew ? 'Create New Page' : 'Edit Page'}</CardTitle><CardDescription>Fill in the details for your custom page.</CardDescription></CardHeader>
              <CardContent className="grid gap-6">
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} placeholder="e.g., About Our Farm" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>URL Slug</FormLabel><FormControl><div className="relative"><Input {...field} placeholder="e.g., about-our-farm" className="pl-20" /><span className="absolute left-1 top-1/2 -translate-y-1/2 text-sm text-muted-foreground bg-muted h-8 px-2 flex items-center rounded-l-md border border-r-0 border-input">/{username}/pages/</span></div></FormControl><FormDescription>The unique URL path for this page.</FormDescription><FormMessage /></FormItem>)} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Page Content</CardTitle><CardDescription>Add, edit, and reorder content blocks to build your page.</CardDescription></CardHeader>
              <CardContent>
                <div className="rounded-lg border p-4">
                    <BlockEditor control={form.control} namePrefix="content" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Publishing</CardTitle></CardHeader>
              <CardContent>
                <FormField control={form.control} name="is_published" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Publish Page</FormLabel><FormDescription>Make this page accessible to the public.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
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
