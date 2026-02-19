'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import type { ShippingZone } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal, X, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';


const shippingZoneSchema = z.object({
    name: z.string().min(1, 'Zone name is required.'),
    price: z.coerce.number().min(0, 'Price must be a non-negative number.'),
    is_enabled: z.boolean().default(true),
});

type ShippingZoneFormData = z.infer<typeof shippingZoneSchema>;

export default function ShippingAdminPage() {
    const { user } = useAuth();
    const { shipping: zones, setShipping: setZones } = useAdminStore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);

    const form = useForm<ShippingZoneFormData>({
        resolver: zodResolver(shippingZoneSchema),
        defaultValues: { name: '', price: 0, is_enabled: true },
    });

    const fetchZones = useCallback(async (force = false) => {
        if (!user) return;
        
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.shipping < 300000;
        if (!force && store.shipping.length > 0 && isFresh) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/shipping/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setZones(result.zones as ShippingZone[]);
            } else {
                throw new Error(result.error || 'Failed to fetch shipping zones');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching shipping zones', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, setZones, toast]);

    useEffect(() => {
        if(user) {
            fetchZones();
        }
    }, [user, fetchZones]);

    useEffect(() => {
        if (isFormOpen) {
            if (selectedZone) {
                form.reset({ name: selectedZone.name, price: selectedZone.price, is_enabled: selectedZone.is_enabled });
            } else {
                form.reset({ name: '', price: 0, is_enabled: true });
            }
        }
    }, [isFormOpen, selectedZone, form]);

    const onSubmit = async (data: ShippingZoneFormData) => {
        if (!user) return;
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/shipping/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedZone?.id,
                    siteId: user.id,
                    ...data 
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast({ title: `Shipping Zone ${selectedZone ? 'Updated' : 'Created'}` });
                await fetchZones(true);
                setIsFormOpen(false);
                setSelectedZone(null);
            } else {
                throw new Error(result.error || 'Failed to save shipping zone');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'An error occurred', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const openForm = (zone: ShippingZone | null) => {
        setSelectedZone(zone);
        setIsFormOpen(true);
    }
    
    const openDeleteAlert = (zone: ShippingZone) => {
        setSelectedZone(zone);
        setIsAlertOpen(true);
    }

    const handleDelete = async () => {
        if (!selectedZone || !user) return;
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/shipping/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: selectedZone.id,
                    siteId: user.id
                }),
            });

            if (response.ok) {
                toast({ title: 'Shipping Zone Deleted' });
                await fetchZones(true);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete zone');
            }
        } catch (error: any) {
            toast({ title: 'Error Deleting Zone', variant: 'destructive', description: error.message });
        } finally {
            setIsSubmitting(false);
            setIsAlertOpen(false);
            setSelectedZone(null);
        }
    }
    
    if (isLoading && zones.length === 0) {
        return (
            <div className="flex items-center justify-center p-16">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }
    
    return (
        <>
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h1 className="text-2xl font-bold">Shipping Manager</h1>
                    <p className="text-muted-foreground text-sm">Manage shipping zones and costs for your store.</p>
                </div>
                <Button onClick={() => openForm(null)}>
                    <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add Zone</span>
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {zones.length === 0 && !isLoading ? (
                        <div className="text-center py-16">
                             <p className="text-muted-foreground">You have no shipping zones yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Zone
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Zone Name</TableHead>
                                            <TableHead>Cost</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {zones.map((zone) => (
                                            <TableRow key={zone.id}>
                                                <TableCell className="font-medium">{zone.name}</TableCell>
                                                <TableCell>{zone.price.toFixed(2)} BDT</TableCell>
                                                <TableCell>
                                                    <Badge variant={zone.is_enabled ? 'default' : 'outline'}>{zone.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => openForm(zone)} className="mr-2">
                                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(zone)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="grid gap-4 md:hidden p-4">
                                {zones.map((zone) => (
                                    <Card key={zone.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                                                    <Badge variant={zone.is_enabled ? 'default' : 'outline'} className="mt-1">{zone.is_enabled ? 'Enabled' : 'Disabled'}</Badge>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openForm(zone)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(zone)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold text-primary">{zone.price.toFixed(2)} BDT</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Custom Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsFormOpen(false)} />
                    <div className="relative w-full max-w-lg bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{selectedZone ? 'Edit' : 'Add'} Shipping Zone</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zone Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Inside Dhaka" {...field} className="h-12 text-base" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipping Cost (BDT)</FormLabel>
                                            <FormControl><Input type="number" step="1" {...field} className="h-12 text-base" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="is_enabled" render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Enable Zone</FormLabel>
                                                <p className="text-xs text-muted-foreground">Check this to make it available for customers.</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                    )} />
                                </form>
                            </Form>
                        </div>
                        <div className="p-6 border-t flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Zone
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isAlertOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSubmitting && setIsAlertOpen(false)} />
                    <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-4 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                            <h3 className="text-xl font-bold">Are you absolutely sure?</h3>
                        </div>
                        <p className="text-muted-foreground mb-8">This will permanently delete the zone "{selectedZone?.name}". This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsAlertOpen(false)} disabled={isSubmitting}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
