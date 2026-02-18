
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Loader2 } from 'lucide-react';

const translations = { en, bn };

type Order = {
    id: string;
    order_number: string;
    shipping_info: {
        name: string;
        address: string;
        city: string;
        phone: string;
    };
    customer_email: string;
    cart_items: {
        id: string;
        name: string;
        quantity: number;
        price: number;
        imageUrl: string;
    }[];
    created_at: string;
    total: number;
    status: string;
};

export default function OrdersAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const lang = user?.language || 'bn';
    const t = translations[lang].orders;
    const statusTranslations = translations[lang].statuses;
    
    const fetchOrders = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/orders/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
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
    }, [user?.id, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchOrders();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchOrders]);
    
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
    
    if (isLoading) {
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
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">{t.menu}</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>{t.actions}</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                          <Link href={`/admin/orders/${order.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t.viewOrder}
                                                          </Link>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/orders/${order.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            {t.viewOrder}
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <CardDescription className="pt-2">{format(new Date(order.created_at), 'PP')}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center">
                                        <Badge variant={getStatusBadgeVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                        <p className="font-semibold text-lg">{order.total.toFixed(2)} BDT</p>
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
