'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import type { CarouselSlide } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, GripVertical, ArrowUp, ArrowDown, GalleryHorizontal, MoreHorizontal, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
    const { user } = useAuth();
    const { carousel: slides, setCarousel: setSlides } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(() => !useAdminStore.getState().carousel.length);
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

    const fetchSlides = useCallback(async (force = false) => {
        if (!user) return;
        
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.carousel < 300000;
        
        if (!force && store.carousel.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        if (store.carousel.length === 0) setIsLoading(true);

        try {
            const response = await fetch('/api/carousel/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setSlides(result.slides as CarouselSlide[]);
            } else {
                throw new Error(result.error || 'Failed to fetch slides');
            }
        } catch (error: any) {
            if (slides.length === 0) {
                toast({ variant: 'destructive', title: 'Error fetching slides', description: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, setSlides, toast, slides.length]);

    useEffect(() => {
        if (user) {
            fetchSlides();
        }
    }, [user, fetchSlides]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedSlide) {
                form.reset({
                    image_url: selectedSlide.image_url,
                    title: selectedSlide.title,
                    description: selectedSlide.description || '',
                    link: selectedSlide.link || '',
                    link_text: selectedSlide.link_text || '',
                    is_enabled: selectedSlide.is_enabled,
                });
            } else {
                form.reset({ image_url: '', title: '', description: '', link: '', link_text: '', is_enabled: true });
            }
        }
    }, [isFormOpen, selectedSlide, form]);

    const onSubmit = async (data: SlideFormData) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/carousel/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedSlide?.id,
                    siteId: user.id,
                    ...data 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: `Slide ${selectedSlide ? 'Updated' : 'Created'}` });
                await fetchSlides(true);
                setIsFormOpen(false);
                setSelectedSlide(null);
            } else {
                throw new Error(result.error || 'Failed to save slide');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
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
        if (!selectedSlide || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/carousel/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedSlide.id,
                    siteId: user.id
                }),
            });

            if (response.ok) {
                toast({ title: 'Slide Deleted' });
                await fetchSlides(true);
            } else {
                throw new Error('Failed to delete slide');
            }
        } catch (error: any) {
            toast({ title: 'Error Deleting Slide', variant: 'destructive', description: error.message });
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
            setSelectedSlide(null);
        }
    };
    
    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= slides.length || !user) return;
        
        const newSlides = [...slides];
        const [movedItem] = newSlides.splice(index, 1);
        newSlides.splice(newIndex, 0, movedItem);

        const updates = newSlides.map((slide, idx) => ({
            ...slide,
            order: idx
        }));
        
        try {
            const response = await fetch('/api/carousel/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id, updates }),
            });
            if (!response.ok) throw new Error('Reorder failed');
            setSlides(newSlides);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Failed to reorder slides' });
            await fetchSlides(true);
        }
    };
    
    if (isLoading && slides.length === 0) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h1 className="text-2xl font-bold">Homepage Carousel</h1>
                    <p className="text-muted-foreground text-sm">Manage the slides for your homepage hero section.</p>
                </div>
                <Button onClick={() => openForm(null)}>
                    <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add Slide</span>
                </Button>
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
                        <>
                            {/* Desktop View */}
                            <div className="divide-y divide-border hidden md:block">
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

                            {/* Mobile View */}
                            <div className="grid gap-4 md:hidden p-4">
                                {slides.map((slide, index) => (
                                    <Card key={slide.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="relative h-16 w-28 rounded-md overflow-hidden shrink-0">
                                                    <Image src={slide.image_url} alt={slide.title} fill className="object-cover" />
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleMove(index, 'up')} disabled={index === 0}><ArrowUp className="mr-2 h-4 w-4" /> Move Up</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleMove(index, 'down')} disabled={index === slides.length - 1}><ArrowDown className="mr-2 h-4 w-4" /> Move Down</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openForm(slide)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(slide)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <CardTitle className="pt-4">{slide.title}</CardTitle>
                                            <Badge variant={slide.is_enabled ? 'default' : 'outline'} className="w-fit">{slide.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                                        </CardHeader>
                                        {slide.description && (
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">{slide.description}</p>
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
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsFormOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-background rounded-t-[2rem] sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{selectedSlide ? 'Edit Slide' : 'Add New Slide'}</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="image_url" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Slide Image</FormLabel>
                                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                                <div className="relative h-32 w-full sm:w-48 rounded-lg border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                                                    {field.value ? <Image src={field.value} alt="Preview" fill className="object-cover"/> : <span className="text-xs text-muted-foreground">Image Preview</span>}
                                                </div>
                                                <div className="space-y-3 flex-grow w-full">
                                                    <FormControl><Input placeholder="https://example.com/image.png" {...field} className="h-11" /></FormControl>
                                                    <ImageUploader onUpload={(res) => form.setValue('image_url', res.info.secure_url, { shouldValidate: true })} label="Upload Image" />
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., প্রকৃতির আসল স্বাদ" {...field} className="h-11" /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="A short, catchy description." {...field} rows={3} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <FormField control={form.control} name="link_text" render={({ field }) => (
                                            <FormItem><FormLabel>Button Text</FormLabel><FormControl><Input placeholder="e.g., Shop Now" {...field} className="h-11" /></FormControl></FormItem>
                                        )} />
                                        <FormField control={form.control} name="link" render={({ field }) => (
                                            <FormItem><FormLabel>Button Link</FormLabel><FormControl><Input placeholder="e.g., /products" {...field} className="h-11" /></FormControl></FormItem>
                                        )} />
                                    </div>
                                    <FormField control={form.control} name="is_enabled" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
                                            <div className="space-y-0.5"><FormLabel className="text-base">Enable Slide</FormLabel></div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <div className="pt-4 flex gap-3 pb-8 sm:pb-0">
                                        <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20">
                                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Slide'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>
            )}

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this slide.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
