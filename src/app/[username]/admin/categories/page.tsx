'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import type { Category, SiteImage } from '@/types';
import Image from 'next/image';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal, Palette, X, AlertTriangle, Check, Search, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import ImageUploader from '@/components/image-uploader';
import { Skeleton } from '@/components/ui/skeleton';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations = { en, bn };

const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required.'),
    description: z.string().optional(),
    icon: z.string().min(1, 'An icon is required.'),
    image_url: z.string().url().optional().or(z.literal('')),
    card_color: z.string().optional().or(z.literal('')),
});

type CategoryFormData = z.infer<typeof categorySchema>;

const softColorPalette = [
    { name: 'Sky Blue', color: '#f0f9ff' },
    { name: 'Rose', color: '#fdf2f8' },
    { name: 'Mint', color: '#f0fdf4' },
    { name: 'Amber', color: '#fffbeb' },
    { name: 'Purple', color: '#faf5ff' },
    { name: 'Soft Red', color: '#fff1f2' },
    { name: 'Lavender', color: '#f5f3ff' },
    { name: 'Emerald', color: '#ecfdf5' },
    { name: 'Yellow', color: '#fefce8' },
    { name: 'Orange', color: '#fff7ed' },
    { name: 'Indigo', color: '#eef2ff' },
    { name: 'Teal', color: '#f0fdfa' },
    { name: 'Cyan', color: '#ecfeff' },
    { name: 'Slate', color: '#f8fafc' },
    { name: 'Lime', color: '#f7fee7' },
    { name: 'Fuchsia', color: '#fdf4ff' },
    { name: 'Stone', color: '#fafaf9' },
    { name: 'Zinc', color: '#fafafa' },
    { name: 'Warm Blue', color: '#eff6ff' },
    { name: 'Soft Peach', color: '#fff5f5' },
];

export default function CategoriesAdminPage() {
    const { user } = useAuth();
    const { categories, setCategories, images: galleryImages, setImages } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(() => {
        const store = useAdminStore.getState();
        return store.categories.length === 0;
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    // Image Picker State
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pickerPage, setPickerPage] = useState(1);
    const IMAGES_PER_PAGE = 8;

    const lang = user?.language || 'bn';
    const t = translations[lang].categories;
    const common = translations[lang].common;

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', description: '', icon: 'Package', image_url: '', card_color: '' },
    });

    const fetchCategories = useCallback(async (force = false) => {
        if (!user) return;
        
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.categories < 300000;
        
        if (!force && store.categories.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        if (store.categories.length === 0 || force) {
            setIsLoading(true);
        }

        try {
            const response = await fetch('/api/categories/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setCategories(result.categories as Category[]);
            } else {
                throw new Error(result.error || 'Failed to fetch categories');
            }
        } catch (error: any) {
            if (categories.length === 0) {
                toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, setCategories, toast, categories.length]);

    const fetchImages = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch('/api/images/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setImages(result.images || []);
            }
        } catch (e) { console.error("Gallery fetch error:", e); }
    }, [user, setImages]);

    useEffect(() => {
        if(user) {
            fetchCategories();
            fetchImages();
        }
    }, [user, fetchCategories, fetchImages]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedCategory) {
                form.reset({ 
                    name: selectedCategory.name, 
                    description: selectedCategory.description || '', 
                    icon: selectedCategory.icon || 'Package',
                    image_url: selectedCategory.image_url || '',
                    card_color: selectedCategory.card_color || ''
                });
            } else {
                form.reset({ name: '', description: '', icon: 'Package', image_url: '', card_color: '' });
            }
        }
    }, [isFormOpen, selectedCategory, form]);

    const onSubmit = async (data: CategoryFormData) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/categories/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedCategory?.id,
                    siteId: user.id,
                    ...data 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: `Category ${selectedCategory ? 'Updated' : 'Created'}` });
                await fetchCategories(true);
                setIsFormOpen(false);
                setSelectedCategory(null);
            } else {
                throw new Error(result.error || 'Failed to save category');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openForm = (category: Category | null) => {
        setSelectedCategory(category);
        setIsFormOpen(true);
    }
    
    const openDeleteAlert = (category: Category) => {
        setSelectedCategory(category);
        setIsAlertOpen(true);
    }

    const handleDelete = async () => {
        if (!selectedCategory || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/categories/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedCategory.id,
                    siteId: user.id
                }),
            });

            if (response.ok) {
                toast({ title: 'Category Deleted' });
                await fetchCategories(true);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete category');
            }
        } catch (error: any) {
            toast({ title: 'Error Deleting Category', variant: 'destructive', description: error.message });
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
            setSelectedCategory(null);
        }
    }

    // Image Picker Logic
    const filteredGallery = useMemo(() => {
        return galleryImages.filter(img => 
            (img.name || '').toLowerCase().includes(pickerSearch.toLowerCase())
        );
    }, [galleryImages, pickerSearch]);

    const paginatedGallery = useMemo(() => {
        const start = (pickerPage - 1) * IMAGES_PER_PAGE;
        return filteredGallery.slice(start, start + IMAGES_PER_PAGE);
    }, [filteredGallery, pickerPage]);

    const totalPickerPages = Math.ceil(filteredGallery.length / IMAGES_PER_PAGE);

    const handlePickerImageSelect = (url: string) => {
        form.setValue('image_url', url, { shouldValidate: true, shouldDirty: true });
        setIsPickerOpen(false);
    };

    const handlePickerUploadSuccess = async (uploadRes: any) => {
        if (!user) return;
        try {
            const response = await fetch('/api/images/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    siteId: user.id,
                    url: uploadRes.info.secure_url,
                    name: uploadRes.info.original_filename
                }),
            });
            if (response.ok) {
                const result = await response.json();
                const newImg = result.image;
                setImages([newImg, ...galleryImages]);
                form.setValue('image_url', newImg.url, { shouldValidate: true, shouldDirty: true });
                setIsPickerOpen(false);
                toast({ title: 'Image uploaded and selected!' });
            }
        } catch (e) {
            console.error("Picker upload save error:", e);
        }
    };
    
    if (isLoading && categories.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                    <Skeleton className="h-10 w-36" />
                </div>
                <Card>
                    <CardHeader className="p-0 border-b">
                        <div className="p-4 grid grid-cols-5 gap-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 flex items-center justify-between border-b last:border-0">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-md" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-8 w-20" />
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t.title}</h1>
                    <p className="text-muted-foreground">{t.description}</p>
                </div>
                <Button onClick={() => openForm(null)}>
                    <Plus className="mr-2 h-4 w-4" /> {t.addCategory}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {categories.length === 0 && !isLoading ? (
                        <div className="text-center py-16">
                             <p className="text-muted-foreground">{t.noCategories}</p>
                             <Button className="mt-4" onClick={() => openForm(null)}>
                                <Plus className="mr-2 h-4 w-4" /> {t.addCategory}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">{t.image}/{t.icon}</TableHead>
                                            <TableHead>{t.name}</TableHead>
                                            <TableHead>Card Style</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">{common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell>
                                                    <div 
                                                        className="relative h-12 w-12 rounded-lg overflow-hidden border shadow-sm"
                                                        style={{ backgroundColor: category.card_color || 'transparent' }}
                                                    >
                                                        {category.image_url ? (
                                                            <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <DynamicIcon name={category.icon || 'Package'} className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{category.name}</TableCell>
                                                <TableCell>
                                                    {category.card_color ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-5 w-10 rounded border shadow-sm" style={{ backgroundColor: category.card_color }} />
                                                            <span className="text-[10px] font-mono text-muted-foreground uppercase">{category.card_color}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">None</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground truncate max-w-[200px]">{category.description}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openForm(category)} className="mr-2">
                                                        <Edit className="mr-2 h-4 w-4" /> {common.edit}
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(category)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> {common.delete}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="grid gap-4 md:hidden p-4">
                                {categories.map((category) => (
                                    <Card key={category.id}>
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div 
                                                        className="relative h-14 w-14 rounded-2xl overflow-hidden shrink-0 border-2" 
                                                        style={{ backgroundColor: category.card_color || 'transparent', borderColor: category.card_color ? 'rgba(0,0,0,0.05)' : 'transparent' }}
                                                    >
                                                        {category.image_url ? (
                                                            <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <DynamicIcon name={category.icon || 'Package'} className="h-7 w-7 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{category.card_color || 'No background'}</span>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openForm(category)}>
                                                            <Edit className="mr-2 h-4 w-4" /> {common.edit}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(category)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> {common.delete}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        {category.description && (
                                            <CardContent className="px-4 pb-4">
                                                <p className="text-muted-foreground text-xs italic">"{category.description}"</p>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsFormOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-background rounded-[2rem] shadow-2xl border-2 border-primary/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-xl"><Plus className="h-5 w-5 text-primary" /></div>
                                {selectedCategory ? common.edit : common.add} {t.name}
                            </h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-8">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">{t.name}</FormLabel>
                                                <FormControl><Input placeholder="e.g., ফলমূল" {...field} className="h-12 rounded-xl" /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={form.control} name="card_color" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">Card Background Style</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input {...field} placeholder="e.g., #f0f9ff" className="h-12 rounded-xl font-mono text-xs" />
                                                    </FormControl>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button type="button" variant="outline" size="icon" className="h-12 w-12 shrink-0 rounded-xl shadow-sm border-2">
                                                                <Palette className="h-5 w-5 text-primary" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-72 p-4 rounded-2xl shadow-2xl border-2">
                                                            <DropdownMenuLabel className="px-0 pb-3 text-xs font-black uppercase tracking-widest text-muted-foreground">Select Soft Palette</DropdownMenuLabel>
                                                            <DropdownMenuSeparator className="mb-4" />
                                                            <div className="grid grid-cols-5 gap-3">
                                                                {softColorPalette.map(({name, color}) => (
                                                                    <button 
                                                                        type="button" 
                                                                        key={name} 
                                                                        title={name}
                                                                        className={cn(
                                                                            "h-9 w-9 rounded-xl border-2 transition-all hover:scale-110 flex items-center justify-center relative",
                                                                            field.value === color ? "border-primary ring-4 ring-primary/10" : "border-black/5"
                                                                        )} 
                                                                        style={{ backgroundColor: color }} 
                                                                        onClick={() => form.setValue('card_color', color)}
                                                                    >
                                                                        {field.value === color && <Check className="h-4 w-4 text-primary" />}
                                                                    </button>
                                                                ))}
                                                                <button 
                                                                    type="button" 
                                                                    className="h-9 w-9 rounded-xl border-2 border-dashed flex items-center justify-center bg-background hover:bg-muted"
                                                                    onClick={() => form.setValue('card_color', '')}
                                                                >
                                                                    <X className="h-4 w-4 text-muted-foreground" />
                                                                </button>
                                                            </div>
                                                            <p className="mt-4 text-[10px] text-muted-foreground italic text-center">These soft colors look great on product grids.</p>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                    
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Description (Optional)</FormLabel>
                                            <FormControl><Textarea placeholder="A short description of the category." {...field} rows={2} className="rounded-xl resize-none" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <div className="grid sm:grid-cols-2 gap-8 items-start">
                                        <FormField control={form.control} name="image_url" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">{t.image}</FormLabel>
                                                <div className="flex flex-col gap-4">
                                                    <div 
                                                        className="relative h-32 w-full rounded-2xl border-2 border-dashed flex items-center justify-center bg-muted/30 overflow-hidden shrink-0 shadow-inner"
                                                        style={{ backgroundColor: form.watch('card_color') || 'transparent' }}
                                                    >
                                                        {field.value ? <Image src={field.value} alt="Preview" fill className="object-contain"/> : <div className="text-center flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /><span className="text-[10px] text-muted-foreground font-black uppercase">Preview</span></div>}
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button type="button" variant="outline" className="w-full rounded-xl border-2 border-dashed h-11" onClick={() => setIsPickerOpen(true)}>
                                                            <ImageIcon className="h-4 w-4 mr-2" /> গ্যালারি থেকে ছবি নিন
                                                        </Button>
                                                        <FormControl><Input placeholder="বা ইমেজের লিঙ্ক দিন" {...field} className="rounded-xl h-9 text-[10px]" /></FormControl>
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={form.control} name="icon" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold">{t.icon}</FormLabel>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-primary/10 bg-primary/5">
                                                        <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center shadow-sm">
                                                            <DynamicIcon name={field.value} className="h-6 w-6 text-primary" />
                                                        </div>
                                                        <div className="flex-grow">
                                                            <p className="text-xs font-bold">{field.value}</p>
                                                            <p className="text-[10px] text-muted-foreground">Fallback icon if no image.</p>
                                                        </div>
                                                    </div>
                                                    <FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>
                                </form>
                            </Form>
                        </div>
                        <div className="p-6 border-t flex flex-row gap-3">
                            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="flex-1 h-12 rounded-xl">
                                {common.cancel}
                            </Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20 font-bold">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                {common.save}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Picker Modal */}
            {isPickerOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsPickerOpen(false)} />
                    <div className="relative w-full max-w-4xl bg-background rounded-[2.5rem] shadow-2xl border-2 border-primary/10 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <ImageIcon className="h-6 w-6 text-primary" /> ছবি নির্বাচন করুন
                                </h2>
                                <p className="text-xs text-muted-foreground">গ্যালারি থেকে সিলেক্ট করুন অথবা নতুন ছবি আপলোড করুন।</p>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsPickerOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="p-6 flex flex-col gap-6 flex-grow overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="relative flex-grow w-full sm:max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="ছবির নাম দিয়ে খুঁজুন..." 
                                        className="pl-10 h-11 rounded-xl"
                                        value={pickerSearch}
                                        onChange={(e) => { setPickerSearch(e.target.value); setPickerPage(1); }}
                                    />
                                </div>
                                <ImageUploader onUpload={handlePickerUploadSuccess} label="নতুন আপলোড" />
                            </div>

                            <div className="flex-grow overflow-y-auto pr-2">
                                {paginatedGallery.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {paginatedGallery.map((img) => {
                                            const isSelected = form.watch('image_url') === img.url;
                                            return (
                                                <div 
                                                    key={img.id} 
                                                    onClick={() => handlePickerImageSelect(img.url)}
                                                    className={cn(
                                                        "relative aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all group",
                                                        isSelected ? "border-primary ring-4 ring-primary/10" : "border-border hover:border-primary/40"
                                                    )}
                                                >
                                                    <Image src={img.url} alt={img.name || 'Gallery Image'} fill className="object-cover transition-transform group-hover:scale-110" />
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                            <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
                                                                <Check className="h-5 w-5" />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <p className="text-[10px] text-white truncate text-center">{img.name}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-20">
                                        <ImageIcon className="h-12 w-12 opacity-20 mb-4" />
                                        <p className="text-sm font-bold">কোনো ছবি পাওয়া যায়নি</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-lg" 
                                    disabled={pickerPage === 1}
                                    onClick={() => setPickerPage(p => p - 1)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-xs font-bold px-3 py-1 bg-background rounded-md border">
                                    পৃষ্ঠা {pickerPage} / {totalPickerPages || 1}
                                </span>
                                <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-lg" 
                                    disabled={pickerPage >= totalPickerPages}
                                    onClick={() => setPickerPage(p => p + 1)}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button variant="ghost" onClick={() => setIsPickerOpen(false)}>বাতিল</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isAlertOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsAlertOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-3xl shadow-2xl border-2 border-destructive/10 p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-destructive/10 rounded-full text-destructive animate-pulse">
                                <AlertTriangle className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-bold">{common.confirmDelete}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {common.deleteWarning} <br/> 
                                <span className="font-bold text-foreground">"{selectedCategory?.name}"</span> ক্যাটাগরিটি স্থায়ীভাবে মুছে ফেলা হবে।
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 mt-8">
                            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="h-12 rounded-xl font-bold shadow-lg shadow-destructive/20">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {common.delete}
                            </Button>
                            <Button variant="ghost" onClick={() => setIsAlertOpen(false)} disabled={isSubmitting} className="h-12 rounded-xl">
                                {common.cancel}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
