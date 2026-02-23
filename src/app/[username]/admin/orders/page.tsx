'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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

const translations = { en, bn };
const ITEMS_PER_PAGE = 10;

export default function OrdersAdminPage() {
    const { user } = useAuth();
    const { orders, setOrders } = useAdminStore();
    const { toast } = useToast();
    
    const [isLoading, setIsLoading] = useState(() => {
        const currentStore = useAdminStore.getState();
        return currentStore.orders.length === 0;
    });
    const [currentPage, setCurrentPage] = useState(1);
    
    const lang = user?.language || 'bn';
    const currentTranslations = translations[lang as keyof typeof translations]?.orders || translations.bn.orders;
    const statusTranslations = translations[lang as keyof typeof translations]?.statuses || translations.bn.statuses;
    
    const fetchOrders = useCallback(async (force = false) => {
        const siteId = user?.id;
        if (!siteId) return;

        const currentStore = useAdminStore.getState();
        const now = Date.now();
        const isFresh = now - currentStore.lastFetched.orders < 300000;
        
        if (!force && currentStore.orders.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        if (currentStore.orders.length === 0 || force) {
            setIsLoading(true);
        }

        try {
            const response = await fetch('/api/orders/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            });
            const result = await response.json();
            if (response.ok) {
                setOrders(result.orders || []);
            } else {
                throw new Error(result.error || 'Failed to fetch orders');
            }
        } catch (error: any) {
            if (useAdminStore.getState().orders.length === 0) {
                console.error("Order fetch failed:", error);
            }
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, setOrders]);

    useEffect(() => {
        if (user?.id) {
            fetchOrders();
        }
    }, [user?.id, fetchOrders]);
    
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

    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        return orders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [orders, currentPage]);
    
    if (isLoading && orders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{currentTranslations.title}</CardTitle>
                    <CardDescription>{currentTranslations.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
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
                                {paginatedOrders.map(orderItem => (
                                    <TableRow key={orderItem.id}>
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
                        {paginatedOrders.map(orderItem => (
                            <Card key={orderItem.id}>
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
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        আগেরটি
                    </Button>
                    <div className="text-sm font-medium">পৃষ্ঠা {currentPage} / {totalPages}</div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        পরবর্তী
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}