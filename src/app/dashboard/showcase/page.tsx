'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import type { SaasShowcaseItem } from '@/types';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, GalleryVertical, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import ImageUploader from '@/components/image-uploader';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';

const showcaseSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional(),
    icon: z.string().min(1, 'An icon is required.'),
    image_url: z.string().url().optional().or(z.literal('')),
    is_enabled: z.boolean().default(true),
});

type ShowcaseFormData = z.infer<typeof showcaseSchema>;

export default function ShowcaseAdminPage() {
    const { user } = useAuth();
    const { showcase: items, setShowcase } = useSaasStore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(!items.length);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SaasShowcaseItem | null>(null);

    const form = useForm<ShowcaseFormData>({
        resolver: zodResolver(showcaseSchema),
        defaultValues: { title: '', description: '', icon: 'Sparkles', image_url: '', is_enabled: true },
    });

    const fetchItems = useCallback(async (force = false) => {
        const store = useSaasStore.getState();
        const isFresh = Date.now() - store.lastFetched.showcase < 3600000;
        if (!force && store.showcase.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/saas/fetch-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity: 'showcase' }),
            });
            const result = await response.json();
            if (response.ok) {
                setShowcase(result.data as SaasShowcaseItem[]);
            } else {
                throw new Error(result.error || 'Failed to fetch showcase items');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching showcase items', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [setShowcase, toast]);

    useEffect(() => {
        if (user) {
            fetchItems();
        }
    }, [fetchItems, user]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedItem) {
                form.reset({ 
                    title: selectedItem.title, 
                    description: selectedItem.description || '', 
                    icon: selectedItem.icon || 'Sparkles',
                    image_url: selectedItem.image_url || '',
                    is_enabled: selectedItem.is_enabled,
                });
            } else {
                form.reset({ title: '', description: '', icon: 'Sparkles', image_url: '', is_enabled: true });
            }
        }
    }, [isFormOpen, selectedItem, form]);

    const onSubmit = async (data: ShowcaseFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                id: selectedItem?.id,
                order: selectedItem ? selectedItem.order : items.length,
            };

            const response = await fetch('/api/saas/showcase/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast({ title: selectedItem ? 'Showcase Item Updated' : 'Showcase Item Created' });
                await fetchItems(true);
                setIsFormOpen(false);
                setSelectedItem(null);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to save showcase item');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openForm = (item: SaasShowcaseItem | null) => {
        setSelectedItem(item);
        setIsFormOpen(true);
    };
    
    const openDeleteAlert = (item: SaasShowcaseItem) => {
        setSelectedItem(item);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/saas/showcase/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedItem.id }),
            });

            if (response.ok) {
                toast({ title: 'Showcase Item Deleted' });
                await fetchItems(true);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete item');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Deleting Item', description: error.message });
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
            setSelectedItem(null);
        }
    };
    
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;
        
        const newItems = [...items];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

        const updates = newItems.map((item, idx) => ({
            id: item.id,
            order: idx
        }));
        
        setIsLoading(true);
        try {
            const response = await fetch('/api/saas/showcase/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ updates }),
            });

            if (response.ok) {
                setShowcase(newItems);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to reorder');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to reorder items', description: error.message });
            fetchItems(true);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading && items.length === 0) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Showcase Manager</h1>
                    <p className="text-muted-foreground">Manage the showcase items on the main landing page.</p>
                </div>
                <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {items.length === 0 ? (
                        <div className="text-center py-16">
                            <GalleryVertical className="mx-auto h-12 w-12 text-muted-foreground" />
                             <p className="text-muted-foreground mt-4">You have no showcase items yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add your first item</Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {items.map((item, index) => (
                                <div key={item.id} className="flex items-center p-4 gap-4">
                                    <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                                        {item.image_url ? (
                                            <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <DynamicIcon name={item.icon} className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold">{item.title}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                                    </div>
                                    <Badge variant={item.is_enabled ? 'default' : 'outline'}>{item.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'down')} disabled={index === items.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => openForm(item)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(item)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Custom Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsFormOpen(false)} />
                    <div className="relative w-full max-w-xl bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold">{selectedItem ? 'Edit' : 'Add'} Showcase Item</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Secure Payments" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="image_url" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Image (Optional)</FormLabel>
                                            <div className="flex items-start gap-4">
                                                <div className="relative h-24 w-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                                                    {field.value ? <Image src={field.value} alt="Preview" fill className="object-cover"/> : <span className="text-xs text-muted-foreground">Preview</span>}
                                                </div>
                                                <div className="space-y-2 flex-grow">
                                                    <FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl>
                                                    <ImageUploader onUpload={(res) => form.setValue('image_url', res.info.secure_url, { shouldValidate: true })} />
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="icon" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fallback Icon</FormLabel>
                                            <FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl>
                                            <FormDescription>Shown if no image is uploaded.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="is_enabled" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-muted/30">
                                            <FormLabel>Enabled</FormLabel>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                </form>
                            </Form>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Item
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Modal */}
            {isAlertOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsAlertOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-4 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                            <h3 className="text-xl font-bold text-foreground">Are you sure?</h3>
                        </div>
                        <div className="mb-8"><p className="text-muted-foreground leading-relaxed">This will permanently delete this showcase item. This action cannot be undone.</p></div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsAlertOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete Item
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
