
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { Coupon } from '@/types';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, Ticket, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters.').max(20),
  discount_type: z.enum(['fixed', 'percentage']),
  discount_value: z.preprocess((val) => parseFloat(String(val)), z.number().positive()),
  min_order_amount: z.preprocess((val) => parseFloat(String(val) || '0'), z.number().min(0)),
  max_discount_amount: z.preprocess((val) => (val === '' ? undefined : parseFloat(String(val))), z.number().positive().optional()),
  expiry_date: z.string().optional().or(z.literal('')),
  usage_limit: z.preprocess((val) => (val === '' ? undefined : parseInt(String(val))), z.number().positive().optional()),
  is_active: z.boolean().default(true),
});

type CouponFormData = z.infer<typeof couponSchema>;

export default function CouponsAdminPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

    const form = useForm<CouponFormData>({
        resolver: zodResolver(couponSchema),
        defaultValues: {
            code: '',
            discount_type: 'fixed',
            discount_value: 0,
            min_order_amount: 0,
            is_active: true,
        },
    });

    const fetchCoupons = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/coupons/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setCoupons(result.coupons || []);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        if (user) fetchCoupons();
    }, [user, fetchCoupons]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedCoupon) {
                form.reset({
                    code: selectedCoupon.code,
                    discount_type: selectedCoupon.discount_type,
                    discount_value: selectedCoupon.discount_value,
                    min_order_amount: selectedCoupon.min_order_amount,
                    max_discount_amount: selectedCoupon.max_discount_amount || undefined,
                    expiry_date: selectedCoupon.expiry_date ? format(new Date(selectedCoupon.expiry_date), 'yyyy-MM-dd') : '',
                    usage_limit: selectedCoupon.usage_limit || undefined,
                    is_active: selectedCoupon.is_active,
                });
            } else {
                form.reset({ code: '', discount_type: 'fixed', discount_value: 0, min_order_amount: 0, is_active: true });
            }
        }
    }, [isFormOpen, selectedCoupon, form]);

    const onSubmit = async (data: CouponFormData) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/coupons/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: selectedCoupon?.id, siteId: user.id, ...data }),
            });
            const result = await response.json();
            if (response.ok) {
                toast({ title: `Coupon ${selectedCoupon ? 'Updated' : 'Created'}!` });
                await fetchCoupons();
                setIsFormOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!couponToDelete || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/coupons/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: couponToDelete.id, siteId: user.id }),
            });
            if (response.ok) {
                toast({ title: 'Coupon Deleted' });
                await fetchCoupons();
                setCouponToDelete(null);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && coupons.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Card><CardContent className="p-10"><Skeleton className="h-40 w-full" /></CardContent></Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Ticket className="h-6 w-6 text-primary" /> Promo Codes
                    </h1>
                    <p className="text-muted-foreground">Manage discounts and seasonal offers.</p>
                </div>
                <Button onClick={() => { setSelectedCoupon(null); setIsFormOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Create Coupon
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {coupons.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No coupons found. Create your first discount code!</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Discount</TableHead>
                                    <TableHead>Min. Order</TableHead>
                                    <TableHead>Used</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {coupons.map((coupon) => (
                                    <TableRow key={coupon.id}>
                                        <TableCell className="font-mono font-bold text-primary">{coupon.code}</TableCell>
                                        <TableCell>
                                            {coupon.discount_type === 'percentage' 
                                                ? `${coupon.discount_value}%` 
                                                : `${coupon.discount_value} BDT`}
                                        </TableCell>
                                        <TableCell>{coupon.min_order_amount} BDT</TableCell>
                                        <TableCell>
                                            <span className="text-xs font-bold">{coupon.used_count}</span>
                                            {coupon.usage_limit && <span className="text-muted-foreground"> / {coupon.usage_limit}</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={coupon.is_active ? 'default' : 'outline'}>
                                                {coupon.is_active ? 'Active' : 'Disabled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedCoupon(coupon); setIsFormOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setCouponToDelete(coupon)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Form Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsFormOpen(false)} />
                    <div className="relative w-full max-w-xl bg-background rounded-2xl shadow-2xl border flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b flex justify-between items-center bg-muted/30">
                            <h2 className="text-xl font-bold">{selectedCoupon ? 'Edit' : 'Create'} Coupon</h2>
                            <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}><X /></Button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="code" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Coupon Code</FormLabel>
                                            <FormControl><Input placeholder="e.g. SUMMER25" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="discount_type" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">Fixed Amount (BDT)</SelectItem>
                                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="discount_value" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Value</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="min_order_amount" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Min. Subtotal (BDT)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormDescription>Minimum cart value required.</FormDescription>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="usage_limit" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Usage Limit (Total)</FormLabel>
                                                <FormControl><Input type="number" {...field} placeholder="No limit" /></FormControl>
                                                <FormDescription>Max times this can be used.</FormDescription>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="expiry_date" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Expiry Date</FormLabel>
                                                <FormControl><Input type="date" {...field} /></FormControl>
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="is_active" render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-6">
                                                <FormLabel className="text-xs">Active</FormLabel>
                                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                            </FormItem>
                                        )} />
                                    </div>

                                    <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2" />}
                                        Save Coupon
                                    </Button>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Alert */}
            {couponToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCouponToDelete(null)} />
                    <div className="relative w-full max-w-md bg-background rounded-2xl p-8 border-2 shadow-2xl text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center"><AlertTriangle className="h-10 w-10 text-destructive" /></div>
                        <h3 className="text-xl font-bold">Delete Coupon?</h3>
                        <p className="text-muted-foreground leading-relaxed">This will permanently remove <strong>{couponToDelete.code}</strong>. Customers will no longer be able to use this code.</p>
                        <div className="flex flex-col gap-3">
                            <Button variant="destructive" className="h-12 rounded-xl font-bold" onClick={handleDelete} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Delete Permanently"}
                            </Button>
                            <Button variant="ghost" onClick={() => setCouponToDelete(null)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
