'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { FlashDeal } from '@/types';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, Flame, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function FlashDealsAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [deals, setDeals] = useState<FlashDeal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [dealToDelete, setDealToDelete] = useState<FlashDeal | null>(null);

    const fetchDeals = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const { data: dealsData, error: dealsError } = await supabase.from('flash_deals').select('*, products(*)').eq('site_id', user.id);

        if (dealsError) toast({ variant: 'destructive', title: 'Error fetching deals', description: dealsError.message });
        else setDeals(dealsData as any[] || []);
        
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchDeals();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchDeals]);

    const handleDelete = async () => {
        if (!dealToDelete) return;
        setIsDeleting(true);
        const { error } = await supabase.from('flash_deals').delete().eq('id', dealToDelete.id);
        
        if (error) {
            toast({ title: 'Error Deleting Deal', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Deal Deleted' });
            await fetchDeals();
        }
        
        setIsDeleting(false);
        setDealToDelete(null);
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
                <Button asChild>
                    <Link href={`/admin/flash-deals/new`}>
                        <Plus className="mr-2 h-4 w-4" /> Add Deal
                    </Link>
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {deals.length === 0 ? (
                        <div className="text-center py-16">
                            <Flame className="mx-auto h-12 w-12 text-muted-foreground" />
                             <p className="text-muted-foreground mt-4">You have no flash deals yet.</p>
                             <Button asChild className="mt-4">
                                <Link href={`/admin/flash-deals/new`}>
                                    <Plus className="mr-2 h-4 w-4" /> Add your first deal
                                </Link>
                             </Button>
                        </div>
                    ) : (
                        <>
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
                                                    <Button asChild variant="ghost" size="sm">
                                                        <Link href={`/admin/flash-deals/${deal.id}/edit`}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDealToDelete(deal)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                             <div className="grid gap-4 p-4 md:hidden">
                                {deals.map(deal => (
                                    <Card key={deal.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Image src={deal.products?.images[0]?.imageUrl || 'https://placehold.co/40x40'} alt={deal.products?.name || ''} width={40} height={40} className="rounded-sm object-cover" />
                                                    <div>
                                                        <CardTitle className="text-base">{deal.products?.name}</CardTitle>
                                                        <CardDescription>
                                                            <Badge variant={deal.is_active ? 'default' : 'outline'} className="mt-1">{deal.is_active ? 'Active' : 'Inactive'}</Badge>
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/flash-deals/${deal.id}/edit`}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => setDealToDelete(deal)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm text-muted-foreground">Price</span>
                                                <span className="line-through">{deal.products?.price.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-sm text-muted-foreground">Deal Price</span>
                                                <span className="font-bold text-lg text-primary">{deal.discount_price.toFixed(2)}</span>
                                            </div>
                                             <div className="flex justify-between items-baseline text-xs text-muted-foreground">
                                                <span>Duration</span>
                                                <span>{format(new Date(deal.start_date), 'P')} - {format(new Date(deal.end_date), 'P')}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={!!dealToDelete} onOpenChange={(open) => !open && setDealToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete this deal. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={cn(buttonVariants({ variant: "destructive" }))}>
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
