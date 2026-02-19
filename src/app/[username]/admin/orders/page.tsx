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
import { Eye, Loader2 } from 'lucide-react';

const translations = { en, bn };

export default function OrdersAdminPage() {
    const { user } = useAuth();
    const { orders, setOrders } = useAdminStore();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    const lang = user?.language || 'bn';
    const t = translations[lang].orders;
    const statusTranslations = translations[lang].statuses;
    
    const fetchOrders = useCallback(async (force = false) => {
        const siteId = user?.id;
        if (!siteId) return;

        const store = useAdminStore.getState();
        const isFresh = Date.now() - store.lastFetched.orders < 300000;
        if (!force && store.orders.length > 0 && isFresh) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
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
            toast({ variant: 'destructive', title: "Failed to fetch orders:", description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, setOrders, toast]);

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
    
    if (isLoading && orders.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t.title}</CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t.title}</CardTitle>
                    <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    {orders.length > 0 ? (
                    <>
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t.orderId}</TableHead>
                                        <TableHead>{t.customer}</TableHead>
                                        <TableHead>{t.date}</TableHead>
                                        <TableHead>{t.status}</TableHead>
                                        <TableHead>{t.total}</TableHead>
                                        <TableHead className="text-right">{t.actions}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.order_number}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{order.shipping_info?.name || 'Guest'}</div>
                                                <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                                            </TableCell>
                                            <TableCell>{format(new Date(order.created_at), 'PP')}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                            </TableCell>
                                            <TableCell>{order.total.toFixed(2)} BDT</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" asChild>
                                                    <Link href={`/admin/orders/${order.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        {t.viewOrder}
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="grid gap-4 md:hidden">
                            {orders.map(order => (
                                <Card key={order.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{order.order_number}</CardTitle>
                                                <CardDescription>{order.shipping_info?.name || 'Guest'}</CardDescription>
                                                <CardDescription className="text-xs">{order.customer_email}</CardDescription>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild className="-mt-2 -mr-2">
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                        <CardDescription className="pt-2">{format(new Date(order.created_at), 'PP')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <Badge variant={getStatusBadgeVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                        <div className="text-right">
                                            <p className="font-semibold text-lg">{order.total.toFixed(2)} BDT</p>
                                            <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary">
                                                <Link href={`/admin/orders/${order.id}`}>
                                                    {t.viewOrder}
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                    ) : (
                        <p className="text-muted-foreground text-center py-8">{t.noOrders}</p>
                    )}
                </CardContent>
            </Card>
        </>
    )
}