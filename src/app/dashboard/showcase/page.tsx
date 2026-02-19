
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { SaasShowcaseItem } from '@/types';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, GalleryVertical, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import ImageUploader from '@/components/image-uploader';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const showcaseSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional(),
    icon: z.string().min(1, 'An icon is required.'),
    image_url: z.string().url().optional().or(z.literal('')),
    is_enabled: z.boolean().default(true),
});

type ShowcaseFormData = z.infer<typeof showcaseSchema>;

export default function ShowcaseAdminPage() {
    const { toast } = useToast();
    const [items, setItems] = useState<SaasShowcaseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SaasShowcaseItem | null>(null);

    const form = useForm<ShowcaseFormData>({
        resolver: zodResolver(showcaseSchema),
        defaultValues: { title: '', description: '', icon: 'Sparkles', image_url: '', is_enabled: true },
    });

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/saas/fetch-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entity: 'showcase' }),
            });
            const result = await response.json();
            if (response.ok) {
                setItems(result.data as SaasShowcaseItem[]);
            } else {
                throw new Error(result.error || 'Failed to fetch showcase items');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching showcase items', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

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
        
        let error;
        if (selectedItem) {
            const { error: updateError } = await supabase.from('saas_showcase').update(data).eq('id', selectedItem.id);
            error = updateError;
            if (!error) toast({ title: 'Showcase Item Updated' });
        } else {
            const payload = { ...data, order: items.length };
            const { error: insertError } = await supabase.from('saas_showcase').insert(payload);
            error = insertError;
            if (!error) toast({ title: 'Showcase Item Created' });
        }

        if (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } else {
            await fetchItems();
            setIsFormOpen(false);
            setSelectedItem(null);
        }
        setIsSubmitting(false);
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
        const { error } = await supabase.from('saas_showcase').delete().eq('id', selectedItem.id);
        
        if (error) {
            toast({ title: 'Error Deleting Item', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Showcase Item Deleted' });
            await fetchItems();
        }
        
        setIsSubmitting(false);
        setIsAlertOpen(false);
        setSelectedItem(null);
    };
    
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return;
        
        const newItems = [...items];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

        const updates = newItems.map((item, idx) => ({
            ...item,
            order: idx
        }));
        
        setIsLoading(true);
        const { error } = await supabase.from('saas_showcase').upsert(updates);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reorder items', description: error.message });
            fetchItems(); // Revert on failure
        } else {
            setItems(newItems);
        }
        setIsLoading(false);
    };
    
    if (isLoading) {
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

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedItem ? 'Edit' : 'Add'} Showcase Item</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="image_url" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image (Optional)</FormLabel>
                                    <div className="flex items-start gap-4">
                                        <div className="relative h-24 w-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
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
                            <FormField control={form.control} name="icon" render={({ field }) => (<FormItem><FormLabel>Fallback Icon</FormLabel><FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl><FormDescription>Shown if no image is uploaded.</FormDescription><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="is_enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Enabled</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Item
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this showcase item.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
