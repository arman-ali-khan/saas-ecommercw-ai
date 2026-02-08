'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/types';

import {
  Card,
  CardContent,
  CardDescription,
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
  } from '@/components/ui/dialog';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';


const categorySchema = z.object({
    name: z.string().min(1, 'Category name is required.'),
    description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoriesAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', description: '' },
    });

    const fetchCategories = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('site_id', user.id)
            .order('name', { ascending: true });
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message });
        } else {
            setCategories(data as Category[]);
        }
        setIsLoading(false);
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
                form.reset({ name: selectedCategory.name, description: selectedCategory.description || '' });
            } else {
                form.reset({ name: '', description: '' });
            }
        }
    }, [isFormOpen, selectedCategory, form]);

    const onSubmit = async (data: CategoryFormData) => {
        if (!user) return;
        setIsSubmitting(true);
        const payload = { ...data, site_id: user.id };

        let error;

        if (selectedCategory) {
            // Update
            const { error: updateError } = await supabase
                .from('categories')
                .update(payload)
                .eq('id', selectedCategory.id);
            error = updateError;
            if (!error) toast({ title: 'Category Updated' });
        } else {
            // Create
            const { error: insertError } = await supabase.from('categories').insert(payload);
            error = insertError;
            if (!error) toast({ title: 'Category Created' });
        }

        if (error) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } else {
            await fetchCategories();
            setIsFormOpen(false);
            setSelectedCategory(null);
        }
        setIsSubmitting(false);
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
        if (!selectedCategory) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('categories').delete().eq('id', selectedCategory.id);
        setIsSubmitting(false);

        if (error) {
            toast({ title: 'Error Deleting Category', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Category Deleted' });
            await fetchCategories();
        }

        setIsAlertOpen(false);
        setSelectedCategory(null);
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
                    <h1 className="text-2xl font-bold">Category Manager</h1>
                    <p className="text-muted-foreground">
                        Add, edit, and manage categories for your products.
                    </p>
                </div>
                <Button onClick={() => openForm(null)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {categories.length === 0 ? (
                        <div className="text-center py-16">
                             <p className="text-muted-foreground">You have no categories yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Category
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View: Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categories.map((category) => (
                                            <TableRow key={category.id}>
                                                <TableCell className="font-medium">{category.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{category.description}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openForm(category)} className="mr-2">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(category)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                                                <CardTitle>{category.name}</CardTitle>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openForm(category)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(category)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                        <DialogDescription>
                            {selectedCategory ? 'Update the details for your category.' : 'Fill in the details for your new category.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., ফল" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl><Textarea placeholder="A short description of the category." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Category'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the category "{selectedCategory?.name}". This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className={cn(buttonVariants({ variant: "destructive" }))}
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
