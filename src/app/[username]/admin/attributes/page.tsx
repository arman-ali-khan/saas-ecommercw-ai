
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { ProductAttribute } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, Store, Scale, Ruler, Tags, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const attributeSchema = z.object({
  value: z.string().min(1, 'Value is required.'),
});
type AttributeFormData = z.infer<typeof attributeSchema>;

const attributeTypes = [
  { type: 'brand', label: 'Brands', icon: Store },
  { type: 'unit', label: 'Units', icon: Scale },
  { type: 'size', label: 'Sizes', icon: Ruler },
  { type: 'tag', label: 'Tags', icon: Tags },
  { type: 'color', label: 'Colors', icon: Palette },
];

export default function AttributesAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);
    const [currentAttributeType, setCurrentAttributeType] = useState<string | null>(null);

    const form = useForm<AttributeFormData>({
        resolver: zodResolver(attributeSchema),
        defaultValues: { value: '' },
    });

    const fetchAttributes = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/attributes/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setAttributes(result.attributes as ProductAttribute[]);
            } else {
                throw new Error(result.error || 'Failed to fetch attributes');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching attributes', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if(!authLoading && user) {
            fetchAttributes();
        } else if (!authLoading && !user) {
             setIsLoading(false);
        }
    }, [user, authLoading, fetchAttributes]);
    
    const groupedAttributes = useMemo(() => {
        return attributes.reduce((acc, attr) => {
            (acc[attr.type] = acc[attr.type] || []).push(attr);
            return acc;
        }, {} as Record<string, ProductAttribute[]>);
    }, [attributes]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedAttribute) {
                form.reset({ value: selectedAttribute.value });
            } else {
                form.reset({ value: '' });
            }
        }
    }, [isFormOpen, selectedAttribute, form]);

    const onSubmit = async (data: AttributeFormData) => {
        if (!user || !currentAttributeType) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/attributes/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedAttribute?.id,
                    siteId: user.id,
                    type: currentAttributeType,
                    value: data.value 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: `Attribute ${selectedAttribute ? 'Updated' : 'Created'}` });
                await fetchAttributes();
                setIsFormOpen(false);
            } else {
                throw new Error(result.error || 'Failed to save attribute');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openForm = (attribute: ProductAttribute | null, type: string) => {
        setSelectedAttribute(attribute);
        setCurrentAttributeType(type);
        setIsFormOpen(true);
    };
    
    const openDeleteAlert = (attribute: ProductAttribute) => {
        setSelectedAttribute(attribute);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedAttribute || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/attributes/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedAttribute.id,
                    siteId: user.id
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: 'Attribute Deleted' });
                await fetchAttributes();
            } else {
                throw new Error(result.error || 'Failed to delete attribute');
            }
        } catch (error: any) {
            toast({ title: 'Error Deleting Attribute', variant: 'destructive', description: error.message });
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
        }
    };
    
    if (isLoading && attributes.length === 0) {
        return (
            <div>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-80 mb-8" />
                <div className="space-y-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col items-start mb-6">
                <h1 className="text-2xl font-bold">Attribute Manager</h1>
                <p className="text-muted-foreground">Manage reusable attributes for your products.</p>
            </div>
            
             <Tabs defaultValue={attributeTypes[0].type} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto">
                    {attributeTypes.map(({ type, label, icon: Icon }) => (
                        <TabsTrigger value={type} key={type} className="gap-2">
                           <Icon className="h-5 w-5" />
                           {label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                {attributeTypes.map(({ type, label }) => (
                    <TabsContent value={type} key={type} className="mt-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>{label}</CardTitle>
                                <CardDescription>Manage all your {label.toLowerCase()}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                 <Button onClick={() => openForm(null, type)} size="sm" className="mb-4"><Plus className="mr-2 h-4 w-4" /> Add New</Button>
                                {(groupedAttributes[type] || []).length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Value</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupedAttributes[type].map((attr) => (
                                                <TableRow key={attr.id}>
                                                    <TableCell className="font-medium">{attr.value}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" onClick={() => openForm(attr, type)} className="mr-2">
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(attr)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No {label.toLowerCase()} found.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
            
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedAttribute ? 'Edit' : 'Add'} {currentAttributeType}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Value</FormLabel>
                                    <FormControl><Input placeholder={`Enter a ${currentAttributeType} value`} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save
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
                    <AlertDialogDescription>This will permanently delete the attribute "{selectedAttribute?.value}". This action cannot be undone.</AlertDialogDescription>
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
    );
}
