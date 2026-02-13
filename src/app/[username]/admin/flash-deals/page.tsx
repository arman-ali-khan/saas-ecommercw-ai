
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FlashDeal, Product } from '@/types';
import { format, addDays } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal, Calendar as CalendarIcon, Flame } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import type { DateRange } from 'react-day-picker';

const flashDealSchema = z.object({
  product_id: z.string().min(1, "Please select a product."),
  discount_price: z.coerce.number().positive("Discount price must be a positive number."),
  date_range: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  is_active: z.boolean().default(true),
});

type FlashDealFormData = z.infer<typeof flashDealSchema>;

export default function FlashDealsAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [deals, setDeals] = useState<FlashDeal[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<FlashDeal | null>(null);

    const form = useForm<FlashDealFormData>({
        resolver: zodResolver(flashDealSchema),
        defaultValues: {
            is_active: true,
            date_range: { from: new Date(), to: addDays(new Date(), 7) }
        },
    });

    const fetchDealsAndProducts = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const dealsPromise = supabase.from('flash_deals').select('*, products(*)').eq('site_id', user.id);
        const productsPromise = supabase.from('products').select('*').eq('site_id', user.id);

        const [{ data: dealsData, error: dealsError }, { data: productsData, error: productsError }] = await Promise.all([dealsPromise, productsPromise]);

        if (dealsError) toast({ variant: 'destructive', title: 'Error fetching deals', description: dealsError.message });
        else setDeals(dealsData as any[] || []);

        if (productsError) toast({ variant: 'destructive', title: 'Error fetching products', description: productsError.message });
        else setProducts(productsData || []);
        
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDealsAndProducts();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchDealsAndProducts]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedDeal) {
                form.reset({
                    product_id: selectedDeal.product_id,
                    discount_price: selectedDeal.discount_price,
                    is_active: selectedDeal.is_active,
                    date_range: {
                        from: new Date(selectedDeal.start_date),
                        to: new Date(selectedDeal.end_date)
                    }
                });
            } else {
                form.reset({
                    product_id: '',
                    discount_price: undefined,
                    is_active: true,
                    date_range: { from: new Date(), to: addDays(new Date(), 7) }
                });
            }
        }
    }, [isFormOpen, selectedDeal, form]);

    const onSubmit = async (data: FlashDealFormData) => {
        if (!user) return;

        const payload = {
            site_id: user.id,
            product_id: data.product_id,
            discount_price: data.discount_price,
            start_date: data.date_range.from.toISOString(),
            end_date: data.date_range.to.toISOString(),
            is_active: data.is_active,
        };
        
        setIsSubmitting(true);
        let error;

        if (selectedDeal) {
            const { error: updateError } = await supabase.from('flash_deals').update(payload).eq('id', selectedDeal.id);
            error = updateError;
            if (!error) toast({ title: 'Deal Updated' });
        } else {
            const { error: insertError } = await supabase.from('flash_deals').insert(payload);
            error = insertError;
            if (error?.code === '23505') { // unique constraint violation
                toast({ variant: 'destructive', title: 'Product already has a deal', description: 'A product can only have one flash deal at a time. Please edit the existing one.' });
            } else if (!error) {
                toast({ title: 'Deal Created' });
            }
        }

        if (error && error.code !== '23505') {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        }
        
        if (!error) {
            await fetchDealsAndProducts();
            setIsFormOpen(false);
            setSelectedDeal(null);
        }
        setIsSubmitting(false);
    };

    const openForm = (deal: FlashDeal | null) => {
        setSelectedDeal(deal);
        setIsFormOpen(true);
    };

    const openDeleteAlert = (deal: FlashDeal) => {
        setSelectedDeal(deal);
        setIsAlertOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedDeal) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('flash_deals').delete().eq('id', selectedDeal.id);
        
        if (error) {
            toast({ title: 'Error Deleting Deal', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Deal Deleted' });
            await fetchDealsAndProducts();
        }
        
        setIsSubmitting(false);
        setIsAlertOpen(false);
        setSelectedDeal(null);
    };
    
    if (isLoading) {
        return <div className="flex items-center justify-center p-16"><Loader2 className="h-10 w-10 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Flash Deal Manager</h1>
                    <p className="text-muted-foreground">Create and manage flash deals for your products.</p>
                </div>
                <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add Deal</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {deals.length === 0 ? (
                        <div className="text-center py-16">
                            <Flame className="mx-auto h-12 w-12 text-muted-foreground" />
                             <p className="text-muted-foreground mt-4">You have no flash deals yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add your first deal</Button>
                        </div>
                    ) : (
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Price / Deal Price</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deals.map(deal => (
                                        <TableRow key={deal.id}>
                                            <TableCell className="flex items-center gap-3">
                                                <Image src={deal.products?.images[0]?.imageUrl || 'https://placehold.co/40x40'} alt={deal.products?.name || ''} width={40} height={40} className="rounded-sm object-cover" />
                                                <span className="font-medium">{deal.products?.name}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="line-through text-muted-foreground">{deal.products?.price.toFixed(2)}</span>
                                                <span className="text-primary font-bold ml-2">{deal.discount_price.toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell>{format(new Date(deal.start_date), 'PP')} - {format(new Date(deal.end_date), 'PP')}</TableCell>
                                            <TableCell><Badge variant={deal.is_active ? 'default' : 'outline'}>{deal.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => openForm(deal)}><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(deal)}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>{selectedDeal ? 'Edit Flash Deal' : 'Add New Flash Deal'}</DialogTitle></DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                             <FormField control={form.control} name="product_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!selectedDeal}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {products.map(p => <SelectItem key={p.id} value={p.id} disabled={deals.some(d => d.product_id === p.id && d.id !== selectedDeal?.id)}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                             )} />
                             <FormField control={form.control} name="discount_price" render={({ field }) => (<FormItem><FormLabel>Discount Price (BDT)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />

                            <FormField control={form.control} name="date_range" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Deal Duration</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                <>{format(field.value.from, "LLL dd, y")} - {format(field.value.to, "LLL dd, y")}</>
                                                ) : (
                                                format(field.value.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={field.value?.from}
                                            selected={field.value as DateRange}
                                            onSelect={field.onChange}
                                            numberOfMonths={2}
                                        />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="is_active" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Activate Deal</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                            
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Saving...' : 'Save Deal'}
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
                        <AlertDialogDescription>This will permanently delete this deal. This action cannot be undone.</AlertDialogDescription>
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
