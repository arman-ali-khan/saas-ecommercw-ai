
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { CarouselSlide } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, GalleryHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import ImageUploader from '@/components/image-uploader';

const slideSchema = z.object({
    image_url: z.string().url('A valid image URL is required.'),
    title: z.string().min(1, 'Title is required.'),
    description: z.string().optional(),
    link: z.string().optional(),
    link_text: z.string().optional(),
    is_enabled: z.boolean().default(true),
});

type SlideFormData = z.infer<typeof slideSchema>;

export default function CarouselAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [slides, setSlides] = useState<CarouselSlide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedSlide, setSelectedSlide] = useState<CarouselSlide | null>(null);

    const form = useForm<SlideFormData>({
        resolver: zodResolver(slideSchema),
        defaultValues: {
            image_url: '',
            title: '',
            description: '',
            link: '',
            link_text: '',
            is_enabled: true,
        },
    });

    const fetchSlides = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('carousel_slides')
            .select('*')
            .eq('site_id', user.id)
            .order('order', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching slides', description: error.message });
        } else {
            setSlides(data as CarouselSlide[]);
        }
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchSlides();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchSlides]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedSlide) {
                form.reset(selectedSlide);
            } else {
                form.reset({ image_url: '', title: '', description: '', link: '', link_text: '', is_enabled: true });
            }
        }
    }, [isFormOpen, selectedSlide, form]);

    const onSubmit = async (data: SlideFormData) => {
        if (!user) return;
        setIsSubmitting(true);
        let error;

        if (selectedSlide) {
            // Update
            const { error: updateError } = await supabase
                .from('carousel_slides')
                .update(data)
                .eq('id', selectedSlide.id);
            error = updateError;
            if (!error) toast({ title: 'Slide Updated' });
        } else {
            // Create
            const payload = { ...data, site_id: user.id, order: slides.length };
            const { error: insertError } = await supabase.from('carousel_slides').insert(payload);
            error = insertError;
            if (!error) toast({ title: 'Slide Created' });
        }

        if (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } else {
            await fetchSlides();
            setIsFormOpen(false);
            setSelectedSlide(null);
        }
        setIsSubmitting(false);
    };

    const openForm = (slide: CarouselSlide | null) => {
        setSelectedSlide(slide);
        setIsFormOpen(true);
    };
    
    const openDeleteAlert = (slide: CarouselSlide) => {
        setSelectedSlide(slide);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedSlide) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('carousel_slides').delete().eq('id', selectedSlide.id);
        
        if (error) {
            toast({ title: 'Error Deleting Slide', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Slide Deleted' });
            await fetchSlides();
        }
        
        setIsSubmitting(false);
        setIsAlertOpen(false);
        setSelectedSlide(null);
    };
    
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= slides.length) return;
        
        const newSlides = [...slides];
        const [movedItem] = newSlides.splice(index, 1);
        newSlides.splice(newIndex, 0, movedItem);

        const updates = newSlides.map((slide, idx) => ({
            id: slide.id,
            order: idx
        }));
        
        setIsLoading(true);
        const { error } = await supabase.from('carousel_slides').upsert(updates);
        if (error) {
            toast({ variant: 'destructive', title: 'Failed to reorder slides', description: error.message });
        }
        await fetchSlides();
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Homepage Carousel</h1>
                    <p className="text-muted-foreground">Manage the slides for your homepage hero section.</p>
                </div>
                <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add Slide</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {slides.length === 0 ? (
                        <div className="text-center py-16">
                            <GalleryHorizontal className="mx-auto h-12 w-12 text-muted-foreground" />
                             <p className="text-muted-foreground mt-4">You have no slides yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add your first slide</Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {slides.map((slide, index) => (
                                <div key={slide.id} className="flex items-center p-4 gap-4">
                                    <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                                    <div className="relative h-16 w-28 rounded-md overflow-hidden shrink-0">
                                        <Image src={slide.image_url} alt={slide.title} fill className="object-cover" />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold">{slide.title}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{slide.description}</p>
                                    </div>
                                    <Badge variant={slide.is_enabled ? 'default' : 'outline'}>{slide.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleMove(index, 'down')} disabled={index === slides.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" onClick={() => openForm(slide)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(slide)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader><DialogTitle>{selectedSlide ? 'Edit Slide' : 'Add New Slide'}</DialogTitle></DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField control={form.control} name="image_url" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image</FormLabel>
                                    <div className="flex items-start gap-4">
                                        <div className="relative h-24 w-40 rounded-md border flex items-center justify-center bg-muted overflow-hidden">
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
                            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., প্রকৃতির আসল স্বাদ" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short, catchy description for the slide." {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="link_text" render={({ field }) => (<FormItem><FormLabel>Button Text</FormLabel><FormControl><Input placeholder="e.g., Shop Now" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name="link" render={({ field }) => (<FormItem><FormLabel>Button Link</FormLabel><FormControl><Input placeholder="e.g., /products" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name="is_enabled" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Enable Slide</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Slide'}
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
                        <AlertDialogDescription>This will permanently delete this slide. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
