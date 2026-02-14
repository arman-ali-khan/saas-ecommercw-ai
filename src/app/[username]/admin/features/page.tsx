'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { StoreFeature } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, Sparkles, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import ImageUploader from '@/components/image-uploader';

const featureSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional(),
    icon: z.string().min(1, 'An icon is required.'),
    image_url: z.string().url().optional().or(z.literal('')),
});

type FeatureFormData = z.infer<typeof featureSchema>;

export default function FeaturesAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [features, setFeatures] = useState<StoreFeature[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<StoreFeature | null>(null);

    const form = useForm<FeatureFormData>({
        resolver: zodResolver(featureSchema),
        defaultValues: { title: '', description: '', icon: 'Sparkles', image_url: '' },
    });

    const fetchFeatures = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('store_features')
            .select('*')
            .eq('site_id', user.id)
            .order('order', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching features', description: error.message });
        } else {
            setFeatures(data as StoreFeature[]);
        }
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchFeatures();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchFeatures]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedFeature) {
                form.reset({ 
                    title: selectedFeature.title, 
                    description: selectedFeature.description || '', 
                    icon: selectedFeature.icon || 'Sparkles',
                    image_url: selectedFeature.image_url || ''
                });
            } else {
                form.reset({ title: '', description: '', icon: 'Sparkles', image_url: '' });
            }
        }
    }, [isFormOpen, selectedFeature, form]);

    const onSubmit = async (data: FeatureFormData) => {
        if (!user) return;
        setIsSubmitting(true);
        
        let error;

        if (selectedFeature) {
            const payload = { ...data };
            const { error: updateError } = await supabase
                .from('store_features')
                .update(payload)
                .eq('id', selectedFeature.id);
            error = updateError;
            if (!error) toast({ title: 'Feature Updated' });
        } else {
            const payload = { ...data, site_id: user.id, order: features.length };
            const { error: insertError } = await supabase.from('store_features').insert(payload);
            error = insertError;
            if (!error) toast({ title: 'Feature Created' });
        }

        if (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } else {
            await fetchFeatures();
            setIsFormOpen(false);
            setSelectedFeature(null);
        }
        setIsSubmitting(false);
    };

    const openForm = (feature: StoreFeature | null) => {
        setSelectedFeature(feature);
        setIsFormOpen(true);
    };
    
    const openDeleteAlert = (feature: StoreFeature) => {
        setSelectedFeature(feature);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedFeature) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('store_features').delete().eq('id', selectedFeature.id);
        
        if (error) {
            toast({ title: 'Error Deleting Feature', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Feature Deleted' });
            await fetchFeatures();
        }
        
        setIsSubmitting(false);
        setIsAlertOpen(false);
        setSelectedFeature(null);
    };
    
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= features.length) return;
        
        const newFeatures = [...features];
        const [movedItem] = newFeatures.splice(index, 1);
        newFeatures.splice(newIndex, 0, movedItem);

        const updates = newFeatures.map((feature, idx) => ({
            id: feature.id,
            order: idx
        }));
        
        setIsLoading(true);
        const { error } = await supabase.from('store_features').upsert(updates);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reorder features', description: error.message });
        }
        await fetchFeatures();
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Store Features</h1>
                    <p className="text-muted-foreground">Manage features for the "Why We Are Different" section. You can edit the section title in the <Link href="/admin/section-manager" className="text-primary underline">Section Manager</Link>.</p>
                </div>
                <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add Feature</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {features.length === 0 ? (
                        <div className="text-center py-16">
                            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground" />
                             <p className="text-muted-foreground mt-4">You have no features yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add your first feature</Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View */}
                            <div className="divide-y divide-border hidden md:block">
                                {features.map((feature, index) => (
                                    <div key={feature.id} className="flex items-center p-4 gap-4">
                                        <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted">
                                            {feature.image_url ? (
                                                <Image src={feature.image_url} alt={feature.title} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <DynamicIcon name={feature.icon} className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-semibold">{feature.title}</h3>
                                            <p className="text-sm text-muted-foreground truncate">{feature.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'down')} disabled={index === features.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => openForm(feature)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(feature)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                             {/* Mobile View */}
                            <div className="grid gap-4 md:hidden p-4">
                                {features.map((feature, index) => (
                                    <Card key={feature.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0 bg-muted">
                                                        {feature.image_url ? (
                                                            <Image src={feature.image_url} alt={feature.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <DynamicIcon name={feature.icon} className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <CardTitle>{feature.title}</CardTitle>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="mr-2 h-4 w-4" /> Move Up</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleMove(index, 'down')} disabled={index === features.length - 1}><ArrowDown className="mr-2 h-4 w-4" /> Move Down</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openForm(feature)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(feature)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        {feature.description && (
                                            <CardContent>
                                                <p className="text-muted-foreground text-sm">{feature.description}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{selectedFeature ? 'Edit Feature' : 'Add New Feature'}</DialogTitle>
                        <DialogDescription>
                            {selectedFeature ? 'Update the details for this feature.' : 'Fill in the details for your new feature.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., সরাসরি কৃষক থেকে" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short description of the feature." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="image_url" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Feature Image (Optional)</FormLabel>
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
                            <FormField control={form.control} name="icon" render={({ field }) => (<FormItem><FormLabel>Fallback Icon</FormLabel><FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl><FormDescription>This icon will be shown if no image is uploaded.</FormDescription><FormMessage /></FormItem>)} />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Feature'}
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
                        <AlertDialogDescription>This will permanently delete this feature. This action cannot be undone.</AlertDialogDescription>
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
