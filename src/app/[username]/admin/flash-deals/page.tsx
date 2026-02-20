'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import type { FlashDeal } from '@/types';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, Flame, MoreHorizontal, X, AlertTriangle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

export default function FlashDealsAdminPage() {
    const { user } = useAuth();
    const { flashDeals: deals, setFlashDeals: setDeals } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(() => {
        const store = useAdminStore.getState();
        return store.flashDeals.length === 0;
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [dealToDelete, setDealToDelete] = useState<FlashDeal | null>(null);

    const fetchDeals = useCallback(async (force = false) => {
        if (!user) return;
        
        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.flashDeals < 300000;
        
        if (!force && store.flashDeals.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        if (store.flashDeals.length === 0 || force) {
            setIsLoading(true);
        }

        try {
            const response = await fetch('/api/flash-deals/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setDeals(result.deals as FlashDeal[]);
            } else {
                throw new Error(result.error || 'Failed to fetch deals');
            }
        } catch (error: any) {
            if (deals.length === 0) {
                toast({ variant: 'destructive', title: 'Error fetching deals', description: error.message });
            }
        } finally {
            setIsLoading(false);
        }
    }, [user, setDeals, toast, deals.length]);

    useEffect(() => {
        if (user) {
            fetchDeals();
        }
    }, [user, fetchDeals]);

    const handleDelete = async () => {
        if (!dealToDelete || !user) return;
        setIsDeleting(true);
        try {
            const response = await fetch('/api/flash-deals/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: dealToDelete.id,
                    siteId: user.id
                }),
            });

            if (response.ok) {
                toast({ title: 'Deal Deleted' });
                await fetchDeals(true);
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to delete deal');
            }
        } catch (error: any) {
            toast({ title: 'Error Deleting Deal', variant: 'destructive', description: error.message });
        } finally {
            setIsDeleting(false);
            setDealToDelete(null);
        }
    };
    
    if (isLoading && deals.length === 0) {
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
                    {deals.length === 0 && !isLoading ? (
                        <div className="text-center py-16">
                            <Flame className="mx-auto h-12 w-12 text-muted-foreground" />
                             <p className="text-muted-foreground mt-4">You have no flash deals yet.</p>
                             <Button asChild className="mt-4">
                                <Link href={`/admin/flash-deals/new`}><Plus className="mr-2 h-4 w-4" /> Add your first deal</Link>
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
                                                        <Link href={`/admin/flash-deals/${deal.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
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
                                                        <Button variant="ghost" size="icon" className="-mt-2 -mr-2"><MoreHorizontal className="h-4 w-4" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem asChild><Link href={`/admin/flash-deals/${deal.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive" onClick={() => setDealToDelete(deal)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex justify-between items-baseline"><span className="text-sm text-muted-foreground">Price</span><span className="line-through">{deal.products?.price.toFixed(2)}</span></div>
                                            <div className="flex justify-between items-baseline"><span className="text-sm text-muted-foreground">Deal Price</span><span className="font-bold text-lg text-primary">{deal.discount_price.toFixed(2)}</span></div>
                                             <div className="flex justify-between items-baseline text-xs text-muted-foreground"><span>Duration</span><span>{format(new Date(deal.start_date), 'P')} - {format(new Date(deal.end_date), 'P')}</span></div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Custom Delete Modal */}
            {dealToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setDealToDelete(null)} />
                    <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-4 text-destructive">
                            <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                            <h3 className="text-xl font-bold">Are you absolutely sure?</h3>
                        </div>
                        <p className="text-muted-foreground mb-8">This will permanently delete this flash deal. This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setDealToDelete(null)} disabled={isDeleting}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}