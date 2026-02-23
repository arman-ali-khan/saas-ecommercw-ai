'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import type { StoreFeature } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, Sparkles, MoreHorizontal, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import ImageUploader from '@/components/image-uploader';
import { Skeleton } from '@/components/ui/skeleton';

const featureSchema = z.object({
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional(),
    icon: z.string().min(1, 'An icon is required.'),
    image_url: z.string().url().optional().or(z.literal('')),
});

type FeatureFormData = z.infer<typeof featureSchema>;

export default function FeaturesAdminPage() {
    const { user } = useAuth();
    const { features, setFeatures } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(() => !useAdminStore.getState().features.length);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<StoreFeature | null>(null);

    const form = useForm<FeatureFormData>({
        resolver: zodResolver(featureSchema),
        defaultValues: { title: '', description: '', icon: 'Sparkles', image_url: '' },
    });

    const fetchFeatures = useCallback(async (force = false) => {
        if (!user) return;
        
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.features < 300000;
        
        if (!force && store.features.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        if (store.features.length === 0) setIsLoading(true);

        try {
            const response = await fetch('/api/store-features/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setFeatures(result.features as StoreFeature[]);
            } else {
                throw new Error(result.error || 'Failed to fetch features');
            }
        } catch (error: any) {
            if (features.length === 0) {
                toast({ variant: 'destructive', title: 'Error fetching features', description: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, setFeatures, toast, features.length]);

    useEffect(() => {
        if (user) {
            fetchFeatures();
        }
    }, [user, fetchFeatures]);

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
        
        try {
            const response = await fetch('/api/store-features/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedFeature?.id,
                    siteId: user.id,
                    ...data 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: `Feature ${selectedFeature ? 'Updated' : 'Created'}` });
                await fetchFeatures(true);
                setIsFormOpen(false);
                setSelectedFeature(null);
            } else {
                throw new Error(result.error || 'Failed to save feature');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
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
        if (!selectedFeature || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/store-features/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedFeature.id,
                    siteId: user.id
                }),
            });

            if (response.ok) {
                toast({ title: 'Feature Deleted' });
                await fetchFeatures(true);
            } else {
                throw new Error('Failed to delete feature');
            }
        } catch (error: any) {
            toast({ title: 'Error Deleting Feature', variant: 'destructive', description: error.message });
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
            setSelectedFeature(null);
        }
    };
    
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= features.length || !user) return;
        
        const newFeatures = [...features];
        const [movedItem] = newFeatures.splice(index, 1);
        newFeatures.splice(newIndex, 0, movedItem);

        const updates = newFeatures.map((feature, idx) => ({
            ...feature,
            order: idx
        }));
        
        try {
            const response = await fetch('/api/store-features/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id, updates }),
            });
            if (!response.ok) throw new Error('Reorder failed');
            setFeatures(newFeatures);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to reorder features' });
            await fetchFeatures(true);
        }
    };
    
    if (isLoading && features.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>
                <Card>
                    <CardContent className="p-0">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-center p-4 gap-4 border-b last:border-0">
                                <Skeleton className="h-5 w-5 rounded shrink-0" />
                                <Skeleton className="h-16 w-16 rounded-md shrink-0" />
                                <div className="flex-grow space-y-2">
                                    <Skeleton className="h-5 w-1/3" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h1 className="text-2xl font-bold">Store Features</h1>
                    <p className="text-muted-foreground text-sm">Manage features for the "Why We Are Different" section.</p>
                </div>
                <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add Feature</span></Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {features.length === 0 ? (
                        <div className="text-center py-24 bg-card rounded-3xl border border-dashed border-border/50">
                            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                             <p className="text-muted-foreground">You have no features yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add your first feature</Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View */}
                            <div className="divide-y divide-border hidden md:block">
                                {features.map((feature, index) => (
                                    <div key={feature.id} className="flex items-center p-4 gap-4 group transition-colors hover:bg-muted/30">
                                        <GripVertical className="h-5 w-5 text-muted-foreground shrink-0 cursor-grab" />
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden shrink-0 bg-muted border">
                                            {feature.image_url ? (
                                                <Image src={feature.image_url} alt={feature.title} fill className="object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <DynamicIcon name={feature.icon} className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <h3 className="font-bold text-sm sm:text-base leading-tight truncate">{feature.title}</h3>
                                            <p className="text-xs sm:text-sm text-muted-foreground truncate mt-1">{feature.description}</p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(index, 'down')} disabled={index === features.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openForm(feature)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteAlert(feature)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                             {/* Mobile View */}
                            <div className="grid gap-4 md:hidden p-4">
                                {features.map((feature, index) => (
                                    <Card key={feature.id} className="border-2">
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-12 w-12 rounded-md overflow-hidden shrink-0 bg-muted border">
                                                        {feature.image_url ? (
                                                            <Image src={feature.image_url} alt={feature.title} fill className="object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <DynamicIcon name={feature.icon} className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-base font-bold">{feature.title}</CardTitle>
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
                                            <CardContent className="p-4 pt-0">
                                                <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsFormOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-background rounded-t-[2rem] sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col border-2 border-primary/10">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{selectedFeature ? 'Edit Feature' : 'Add New Feature'}</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Title</FormLabel><FormControl><Input placeholder="e.g., সরাসরি কৃষক থেকে" {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Description</FormLabel><FormControl><Textarea placeholder="A short description." {...field} rows={3} className="resize-none" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="image_url" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Feature Image (Optional)</FormLabel>
                                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                                <div className="relative h-24 w-24 rounded-xl border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden shrink-0">
                                                    {field.value ? <Image src={field.value} alt="Preview" fill className="object-cover"/> : <span className="text-[10px] text-muted-foreground uppercase font-black">Preview</span>}
                                                </div>
                                                <div className="space-y-3 flex-grow w-full">
                                                    <FormControl><Input placeholder="https://example.com/image.png" {...field} className="h-11" /></FormControl>
                                                    <ImageUploader onUpload={(res) => form.setValue('image_url', res.info.secure_url, { shouldValidate: true })} label="Upload New Image" />
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="icon" render={({ field }) => (
                                        <FormItem><FormLabel className="font-bold">Fallback Icon</FormLabel><FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="pt-4 flex gap-3 pb-8 sm:pb-0">
                                        <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20 font-bold">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Feature'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3 mb-2 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-full"><Trash2 className="h-6 w-6" /></div>
                            <AlertDialogTitle className="text-xl">Are you absolutely sure?</AlertDialogTitle>
                        </div>
                        <AlertDialogDescription>
                            This will permanently delete this feature. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }), "rounded-xl shadow-lg shadow-destructive/20")}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
