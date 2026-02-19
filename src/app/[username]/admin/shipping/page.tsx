
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import type { ShippingZone } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal, X } from 'lucide-react';
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
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);

    const form = useForm<ShippingZoneFormData>({
        resolver: zodResolver(shippingZoneSchema),
        defaultValues: { name: '', price: 0, is_enabled: true },
    });

    const fetchZones = useCallback(async () => {
        if (!user) return;
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
    }, [user, toast]);

    useEffect(() => {
        if(!authLoading && user) {
            fetchZones();
        } else if (!authLoading && !user) {
             setIsLoading(false);
        }
    }, [user, authLoading, fetchZones]);

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
                await fetchZones();
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

            const result = await response.json();

            if (response.ok) {
                toast({ title: 'Shipping Zone Deleted' });
                await fetchZones();
            } else {
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
    
    if (isLoading) {
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
                    <p className="text-muted-foreground text-sm">
                        Manage shipping zones and costs for your store.
                    </p>
                </div>
                <Button onClick={() => openForm(null)}>
                    <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Add Zone</span>
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {zones.length === 0 ? (
                        <div className="text-center py-16">
                             <p className="text-muted-foreground">You have no shipping zones yet.</p>
                             <Button className="mt-4" onClick={() => openForm(null)}>
                                <Plus className="mr-2 h-4 w-4" /> Add Zone
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop View: Table */}
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
                                                    <Badge variant={zone.is_enabled ? 'default' : 'outline'}>
                                                        {zone.is_enabled ? 'Enabled' : 'Disabled'}
                                                    </Badge>
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

                            {/* Mobile View: Cards */}
                            <div className="grid gap-4 md:hidden p-4">
                                {zones.map((zone) => (
                                    <Card key={zone.id} className="relative overflow-hidden group">
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                                                    <Badge variant={zone.is_enabled ? 'default' : 'outline'} className="mt-1">
                                                        {zone.is_enabled ? 'Enabled' : 'Disabled'}
                                                    </Badge>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openForm(zone)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(zone)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
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

            {/* Custom Raw Tailwind Dialog */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsFormOpen(false)}
                    />
                    
                    {/* Dialog Content */}
                    <div className="relative w-full max-w-lg bg-background rounded-t-[2rem] sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-xl font-bold">{selectedZone ? 'Edit' : 'Add'} Shipping Zone</h2>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        
                        <div className="p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Zone Name</FormLabel>
                                            <FormControl><Input placeholder="e.g., Inside Dhaka" {...field} className="h-12 text-base" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shipping Cost (BDT)</FormLabel>
                                            <FormControl><Input type="number" step="1" {...field} className="h-12 text-base" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="is_enabled"
                                        render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Enable Zone</FormLabel>
                                                <p className="text-xs text-muted-foreground">Check this to make it available for customers.</p>
                                            </div>
                                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        </FormItem>
                                        )}
                                    />
                                    <div className="pt-4 flex gap-3 pb-6 sm:pb-0">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="flex-1 h-12 rounded-xl"
                                            onClick={() => setIsFormOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isSubmitting} 
                                            className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                            ) : (
                                                'Save Zone'
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
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the zone "{selectedZone?.name}". This action cannot be undone.
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
