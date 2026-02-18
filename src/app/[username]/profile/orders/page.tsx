
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/types';

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
import { Eye, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export default function OrdersPage() {
    const t = useTranslation();
    const { profile: t_profile, statuses: t_statuses } = t;
    const { customer, loading: customerLoading } = useCustomerAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        if (!customer) {
            setIsLoading(false);
            return;
        };

        setIsLoading(true);
        try {
            const response = await fetch('/api/customers/get-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: customer.id, siteId: customer.site_id }),
            });
            const result = await response.json();
            if (response.ok) {
                setOrders(result.orders || []);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error fetching orders', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [customer, toast]);

    useEffect(() => {
        if (!customerLoading && customer) {
            fetchOrders();
        } else if (!customerLoading && !customer) {
            setIsLoading(false);
        }
    }, [customer, customerLoading, fetchOrders]);
    
    const translateStatus = (status: string): string => {
        const lowerStatus = status.toLowerCase();
        return t_statuses[lowerStatus as keyof typeof t_statuses] || status;
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
      
    const isCancellable = (status: string) => {
        return ['pending'].includes(status.toLowerCase());
    };

    const handleCancelOrder = async (orderId: string) => {
        // We still use an API for cancellation or direct Supabase if policy allows.
        // For security, let's use the update-status API if possible or create a new cancel API.
        // For now, I'll use the existing update-status API which is robust.
        try {
            const response = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, newStatus: 'canceled' }),
            });
            if (response.ok) {
                toast({ title: 'অর্ডার বাতিল করা হয়েছে' });
                fetchOrders();
            } else {
                const res = await response.json();
                throw new Error(res.error);
            }
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error canceling order', description: err.message });
        }
    };
    
    if (isLoading || customerLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t_profile.myOrders}</CardTitle>
                    <CardDescription>{t_profile.myOrdersDesc}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t_profile.myOrders}</CardTitle>
                <CardDescription>{t_profile.myOrdersDesc}</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                <>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t_profile.orderId}</TableHead>
                                <TableHead>{t_profile.date}</TableHead>
                                <TableHead>{t_profile.status}</TableHead>
                                <TableHead>{t_profile.total}</TableHead>
                                <TableHead className="text-right">{t_profile.actions}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.order_number}</TableCell>
                                    <TableCell>{format(new Date(order.created_at), 'PPp', { locale: bn })}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                    </TableCell>
                                    <TableCell>{order.total.toFixed(2)} BDT</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/profile/orders/${order.id}`}>
                                                <Eye className="mr-2 h-4 w-4" />
                                                {t_profile.details}
                                            </Link>
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)} disabled={!isCancellable(order.status)}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            {t_profile.cancel}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View: Cards */}
                <div className="grid gap-4 md:hidden">
                    {orders.map(order => (
                        <Card key={order.id}>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                                    <Badge variant={getStatusBadgeVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                </div>
                                <CardDescription>{format(new Date(order.created_at), 'PPp', { locale: bn })}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-semibold text-lg text-right">{order.total.toFixed(2)} BDT</p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                 <Button variant="outline" size="sm" asChild>
                                    <Link href={`/profile/orders/${order.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t_profile.details}
                                    </Link>
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)} disabled={!isCancellable(order.status)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {t_profile.cancel}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                </>
                ) : (
                    <p className="text-muted-foreground text-center py-8">You have no orders yet.</p>
                )}
            </CardContent>
        </Card>
    )
}
