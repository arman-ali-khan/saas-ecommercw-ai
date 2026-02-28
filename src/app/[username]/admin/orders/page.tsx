
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const translations = { en, bn };
const ITEMS_PER_PAGE = 10;

export default function OrdersAdminPage() {
    const { user } = useAuth();
    const { orders, setOrders, totals, setTotal } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    const lang = user?.language || 'bn';
    const currentTranslations = translations[lang as keyof typeof translations]?.orders || translations.bn.orders;
    const statusTranslations = translations[lang as keyof typeof translations]?.statuses || translations.bn.statuses;
    
    const fetchOrders = useCallback(async (page: number) => {
        const siteId = user?.id;
        if (!siteId) return;

        setIsLoading(true);
        try {
            const response = await fetch('/api/orders/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    siteId,
                    limit: ITEMS_PER_PAGE,
                    offset: (page - 1) * ITEMS_PER_PAGE
                }),
            });
            const result = await response.json();
            if (response.ok) {
                setOrders(result.orders || []);
                setTotal('orders', result.total || 0);
            } else {
                throw new Error(result.error || 'Failed to fetch orders');
            }
        } catch (error: any) {
            console.error("Order fetch failed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, setOrders, setTotal]);

    useEffect(() => {
        if (user?.id) {
            fetchOrders(currentPage);
        }
    }, [user?.id, fetchOrders, currentPage]);
    
    const translateStatus = (status: string): string => {
        const lowerStatus = status.toLowerCase();
        return statusTranslations[lowerStatus as keyof typeof statusTranslations] || status;
    };

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'default';
            case 'send for delivery': return 'secondary';
            case 'shipped': return 'secondary';
            case 'approved': return 'secondary';
            case 'packaging': return 'outline';
            case 'processing': return 'outline';
            case 'pending': return 'outline';
            case 'canceled': return 'destructive';
            default: return 'outline';
        }
    };

    const totalPages = Math.ceil(totals.orders / ITEMS_PER_PAGE);
    
    if (isLoading && orders.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-start px-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Card>
                    <CardHeader className="p-0 border-b">
                        <div className="p-4 grid grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 grid grid-cols-6 gap-4 items-center border-b last:border-0">
                                <Skeleton className="h-5 w-20" />
                                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div>
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-5 w-24" />
                                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{currentTranslations.title}</CardTitle>
                <CardDescription>{currentTranslations.description}</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                <>
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{currentTranslations.orderId}</TableHead>
                                    <TableHead>{currentTranslations.customer}</TableHead>
                                    <TableHead>{currentTranslations.date}</TableHead>
                                    <TableHead>{currentTranslations.status}</TableHead>
                                    <TableHead>{currentTranslations.total}</TableHead>
                                    <TableHead className="text-right">{currentTranslations.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map(orderItem => (
                                    <TableRow key={orderItem.id} className={cn(isLoading && "opacity-50")}>
                                        <TableCell className="font-medium">{orderItem.order_number}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{orderItem.shipping_info?.name || 'Guest'}</div>
                                            <div className="text-sm text-muted-foreground">{orderItem.customer_email}</div>
                                        </TableCell>
                                        <TableCell>{format(new Date(orderItem.created_at), 'PP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(orderItem.status)}>{translateStatus(orderItem.status)}</Badge>
                                        </TableCell>
                                        <TableCell>{orderItem.total.toFixed(2)} BDT</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/admin/orders/${orderItem.id}`}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    {currentTranslations.viewOrder}
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="grid gap-4 md:hidden">
                        {orders.map(orderItem => (
                            <Card key={orderItem.id} className={cn(isLoading && "opacity-50")}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{orderItem.order_number}</CardTitle>
                                            <CardDescription>{orderItem.shipping_info?.name || 'Guest'}</CardDescription>
                                            <CardDescription className="text-xs">{orderItem.customer_email}</CardDescription>
                                        </div>
                                        <Button variant="ghost" size="icon" asChild className="-mt-2 -mr-2">
                                            <Link href={`/admin/orders/${orderItem.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                    <CardDescription className="pt-2">{format(new Date(orderItem.created_at), 'PP')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <Badge variant={getStatusBadgeVariant(orderItem.status)}>{translateStatus(orderItem.status)}</Badge>
                                    <div className="text-right">
                                        <p className="font-semibold text-lg">{orderItem.total.toFixed(2)} BDT</p>
                                        <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary">
                                            <Link href={`/admin/orders/${orderItem.id}`}>
                                                {currentTranslations.viewOrder}
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
                ) : (
                    <p className="text-muted-foreground text-center py-8">{currentTranslations.noOrders}</p>
                )}
            </CardContent>
            {totalPages > 1 && (
                <CardFooter className="flex justify-center gap-4 py-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                        আগেরটি
                    </Button>
                    <div className="text-sm font-medium">পৃষ্ঠা {currentPage} / {totalPages}</div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                        পরবর্তী
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}
