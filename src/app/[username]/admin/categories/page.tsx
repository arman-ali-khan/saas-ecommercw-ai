'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/types';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal, Palette, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import ImageUploader from '@/components/image-uploader';
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

export default function CategoriesAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const lang = user?.language || 'bn';
    const t = translations[lang].categories;
    const common = translations[lang].common;

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', description: '', icon: 'Package', image_url: '', card_color: '' },
    });

    const fetchCategories = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
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
            toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if(!authLoading && user) {
            fetchCategories();
        } else if (!authLoading && !user) {
             setIsLoading(false);
        }
    }, [user, authLoading, fetchCategories]);

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
                await fetchCategories();
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

            const result = await response.json();

            if (response.ok) {
                toast({ title: 'Category Deleted' });
                await fetchCategories();
            } else {
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
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-16">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t.title}</h1>
                    <p className="text-muted-foreground">
                        {t.description}
                    </p>
                </div>
                <Button onClick={() => openForm(null)}>
                    <Plus className="mr-2 h-4 w-4" /> {t.addCategory}
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {categories.length === 0 ? (
                        <div className="text-center py-16">
                             <p className="text-muted-foreground">{t.noCategories}</p>
                             <Button className="mt-4" onClick={() => openForm(null)}>
                                <Plus className="mr-2 h-4 w-4" /> {t.addCategory}
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[80px]">{t.image}/{t.icon}</TableHead>
                                            <TableHead>{t.name}</TableHead>
                                            <TableHead>Color</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">{common.actions}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell>
                                                    <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted">
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
                                                            <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: category.card_color }} />
                                                            <span className="text-xs font-mono">{category.card_color}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Default</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{category.description}</TableCell>
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

                            {/* Mobile View: Cards */}
                            <div className="grid gap-4 md:hidden p-4">
                                {categories.map((category) => (
                                    <Card key={category.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0 border-2" style={{ borderColor: category.card_color || 'transparent' }}>
                                                        {category.image_url ? (
                                                            <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <DynamicIcon name={category.icon || 'Package'} className="h-6 w-6 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <CardTitle>{category.name}</CardTitle>
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
                                            <CardContent>
                                                <p className="text-muted-foreground">{category.description}</p>
                                            </CardContent>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Custom Raw Tailwind Dialog (Bottom Sheet on Mobile) */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsFormOpen(false)}
                    />
                    
                    {/* Dialog Content */}
                    <div className="relative w-full max-w-2xl bg-background rounded-t-[2rem] sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{selectedCategory ? common.edit : common.add} {t.name}</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t.name}</FormLabel>
                                            <FormControl><Input placeholder="e.g., ফল" {...field} className="h-11" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (Optional)</FormLabel>
                                            <FormControl><Textarea placeholder="A short description of the category." {...field} rows={3} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <FormField control={form.control} name="image_url" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t.image}</FormLabel>
                                            <div className="flex flex-col sm:flex-row items-start gap-4">
                                                <div className="relative h-24 w-24 rounded-md border flex items-center justify-center bg-muted overflow-hidden shrink-0">
                                                    {field.value ? <Image src={field.value} alt="Preview" fill className="object-cover"/> : <span className="text-xs text-muted-foreground">Preview</span>}
                                                </div>
                                                <div className="space-y-2 flex-grow w-full">
                                                    <FormControl><Input placeholder="https://example.com/image.png" {...field} className="h-11" /></FormControl>
                                                    <ImageUploader onUpload={(res) => form.setValue('image_url', res.info.secure_url, { shouldValidate: true })} label="Upload Image" />
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <FormField control={form.control} name="icon" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t.icon}</FormLabel>
                                            <FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl>
                                            <FormDescription>Shown if no image is uploaded.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <FormField control={form.control} name="card_color" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Card Background Color</FormLabel>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <Input {...field} placeholder="e.g., #172554 or hsl(var(--card))" className="h-11" />
                                                </FormControl>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button type="button" variant="outline" size="icon" className="h-11 w-11 shrink-0">
                                                            <Palette className="h-5 w-5" />
                                                            <span className="sr-only">Open color picker</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-64">
                                                        <DropdownMenuLabel>Predefined Palette</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <div className="p-2 grid grid-cols-4 gap-2">
                                                            {defaultColorPalette.map(({name, color}) => (
                                                                <button 
                                                                    type="button" 
                                                                    key={name} 
                                                                    title={name}
                                                                    className="h-8 w-8 rounded-md border focus:outline-none focus:ring-2 focus:ring-ring" 
                                                                    style={{ backgroundColor: color }} 
                                                                    onClick={() => form.setValue('card_color', color)}
                                                                />
                                                            ))}
                                                            <button 
                                                                type="button" 
                                                                title="Clear"
                                                                className="h-8 w-8 rounded-md border flex items-center justify-center bg-background"
                                                                onClick={() => form.setValue('card_color', '')}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <FormDescription>Choose a color for the category card on the homepage.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <div className="pt-4 flex gap-3 pb-8 sm:pb-0">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="flex-1 h-12 rounded-xl"
                                            onClick={() => setIsFormOpen(false)}
                                        >
                                            {common.cancel}
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting} 
                                            className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {common.saving}</>
                                            ) : (
                                                common.save
                                            )}
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
                    <AlertDialogTitle>{common.confirmDelete}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {common.deleteWarning} "{selectedCategory?.name}" মুছে ফেলা হবে।
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{common.cancel}</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {common.delete}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
