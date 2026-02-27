'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import type { ProductAttribute } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, Store, Scale, Ruler, Tags, Palette, X, AlertTriangle, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';


const attributeSchema = z.object({
  type: z.string().min(1, 'Type/Category is required.'),
  value: z.string().min(1, 'Value is required.'),
});
type AttributeFormData = z.infer<typeof attributeSchema>;

const coreTypes = ['brand', 'unit', 'size', 'tag', 'color'];

const attributeTypes = [
  { type: 'brand', label: 'Brands', icon: Store },
  { type: 'unit', label: 'Units', icon: Scale },
  { type: 'size', label: 'Sizes', icon: Ruler },
  { type: 'tag', label: 'Tags', icon: Tags },
  { type: 'color', label: 'Colors', icon: Palette },
  { type: 'custom', label: 'Custom', icon: LayoutGrid },
];

export default function AttributesAdminPage() {
    const { user } = useAuth();
    const { attributes, setAttributes } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(() => {
        const store = useAdminStore.getState();
        return store.attributes.length === 0;
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedAttribute, setSelectedAttribute] = useState<ProductAttribute | null>(null);
    const [currentTab, setCurrentTab] = useState<string>(attributeTypes[0].type);

    const form = useForm<AttributeFormData>({
        resolver: zodResolver(attributeSchema),
        defaultValues: { type: '', value: '' },
    });

    const fetchAttributes = useCallback(async (force = false) => {
        if (!user) return;
        
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.attributes < 300000;
        
        if (!force && store.attributes.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        if (store.attributes.length === 0 || force) {
            setIsLoading(true);
        }

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
            if (attributes.length === 0) {
                toast({ variant: 'destructive', title: 'Error fetching attributes', description: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, setAttributes, toast, attributes.length]);

    useEffect(() => {
        if(user) {
            fetchAttributes();
        }
    }, [user, fetchAttributes]);
    
    const groupedAttributes = useMemo(() => {
        return attributes.reduce((acc, attr) => {
            const type = coreTypes.includes(attr.type) ? attr.type : 'custom';
            (acc[type] = acc[type] || []).push(attr);
            return acc;
        }, {} as Record<string, ProductAttribute[]>);
    }, [attributes]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedAttribute) {
                form.reset({ type: selectedAttribute.type, value: selectedAttribute.value });
            } else {
                form.reset({ type: currentTab === 'custom' ? '' : currentTab, value: '' });
            }
        }
    }, [isFormOpen, selectedAttribute, form, currentTab]);

    const onSubmit = async (data: AttributeFormData) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/attributes/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedAttribute?.id,
                    siteId: user.id,
                    type: data.type.toLowerCase().trim(),
                    value: data.value.trim() 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: `Attribute ${selectedAttribute ? 'Updated' : 'Created'}` });
                await fetchAttributes(true);
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

    const openForm = (attribute: ProductAttribute | null) => {
        setSelectedAttribute(attribute);
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

            if (response.ok) {
                toast({ title: 'Attribute Deleted' });
                await fetchAttributes(true);
            } else {
                const result = await response.json();
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
            <div className="space-y-6">
                <div className="flex flex-col items-start px-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
                </div>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                                <Skeleton className="h-5 w-1/3" />
                                <div className="flex gap-2"><Skeleton className="h-8 w-16" /><Skeleton className="h-8 w-16" /></div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col items-start mb-6 px-1">
                <h1 className="text-2xl font-bold font-headline">Attribute Manager</h1>
                <p className="text-muted-foreground text-sm">Manage standard and custom attributes for your products.</p>
            </div>
            
             <Tabs defaultValue={attributeTypes[0].type} className="w-full" onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/30">
                    {attributeTypes.map(({ type, label, icon: Icon }) => (
                        <TabsTrigger value={type} key={type} className="gap-2 rounded-lg py-2">
                           <Icon className="h-4 w-4" />
                           {label}
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                {attributeTypes.map(({ type, label }) => (
                    <TabsContent value={type} key={type} className="mt-6 animate-in fade-in duration-300">
                        <Card className="border-2 shadow-sm">
                             <CardHeader className="bg-muted/10 border-b">
                                <CardTitle className="text-lg">{label}</CardTitle>
                                <CardDescription className="text-xs">
                                    {type === 'custom' 
                                        ? 'Manage all your specialized categories like Material, Fabric, etc.' 
                                        : `Manage all your ${label.toLowerCase()} settings.`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                 <Button onClick={() => openForm(null)} size="sm" className="mb-6 rounded-full px-6 shadow-lg shadow-primary/20">
                                    <Plus className="mr-2 h-4 w-4" /> Add New
                                 </Button>
                                 
                                {(groupedAttributes[type] || []).length > 0 ? (
                                    <div className="rounded-xl border bg-card overflow-hidden">
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow>
                                                    {type === 'custom' && <TableHead>Category</TableHead>}
                                                    <TableHead>Value</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {groupedAttributes[type].map((attr) => (
                                                    <TableRow key={attr.id}>
                                                        {type === 'custom' && <TableCell className="font-bold text-primary uppercase text-[10px] tracking-widest">{attr.type}</TableCell>}
                                                        <TableCell className="font-medium">{attr.value}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" onClick={() => openForm(attr)} className="h-8 w-8 rounded-full">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => openDeleteAlert(attr)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-muted/5 rounded-2xl border-2 border-dashed">
                                        <p className="text-sm text-muted-foreground">No {label.toLowerCase()} entries found.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
            
            {/* Custom Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsFormOpen(false)} />
                    <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <div className="p-2 bg-primary/10 rounded-xl"><Plus className="h-5 w-5 text-primary" /></div>
                                {selectedAttribute ? 'Edit' : 'Add'} Attribute
                            </h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="type" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Category (Type)</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="e.g., Material, Brand, etc." 
                                                    {...field} 
                                                    disabled={currentTab !== 'custom' && !selectedAttribute} 
                                                    className="h-12 rounded-xl"
                                                />
                                            </FormControl>
                                            <FormDescription className="text-[10px]">
                                                {currentTab === 'custom' ? 'Name of the attribute group (e.g., Fabric).' : 'The category is locked based on the active tab.'}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <FormField control={form.control} name="value" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold">Value</FormLabel>
                                            <FormControl><Input placeholder="e.g., 100% Cotton" {...field} className="h-12 rounded-xl" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </form>
                            </Form>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3 bg-muted/10">
                            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting} className="rounded-xl h-11 px-6">Cancel</Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="rounded-xl h-11 px-8 font-bold shadow-lg shadow-primary/20">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Attribute
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isAlertOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsAlertOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-2xl shadow-2xl border p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="p-4 bg-destructive/10 rounded-full text-destructive animate-pulse">
                                <AlertTriangle className="h-10 w-10" />
                            </div>
                            <h3 className="text-2xl font-bold">Are you sure?</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                This will permanently delete the attribute <span className="font-bold text-foreground">"{selectedAttribute?.value}"</span>. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 mt-8">
                            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting} className="h-12 rounded-xl font-bold shadow-lg shadow-destructive/20">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Delete Permanently
                            </Button>
                            <Button variant="ghost" onClick={() => setIsAlertOpen(false)} disabled={isSubmitting} className="h-12 rounded-xl">
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
