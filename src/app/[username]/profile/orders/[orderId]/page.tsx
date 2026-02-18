
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, User, MapPin, Phone, Mail } from 'lucide-react';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import type { Order } from '@/types';
import { useTranslation } from '@/hooks/use-translation';

export default function CustomerOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { customer, _hasHydrated } = useCustomerAuth();
    const t = useTranslation();
    const { profile: t_profile, statuses: t_statuses } = t;

    const orderId = params.orderId as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchOrder = useCallback(async () => {
        if (!orderId || !customer) return;
        setIsLoading(true);
        
        try {
            const response = await fetch('/api/customers/get-order-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, customerId: customer.id, siteId: customer.site_id }),
            });
            const result = await response.json();
            if (response.ok) {
                setOrder(result.order);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push(`/profile/orders`);
        } finally {
            setIsLoading(false);
        }
    }, [orderId, customer, router, toast]);


    useEffect(() => {
        if(_hasHydrated) {
            fetchOrder();
        }
    }, [_hasHydrated, fetchOrder]);
    
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
    
    const subtotal = order?.cart_items.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;


    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-9 w-48" />
                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-16 w-full" />
                                <Skeleton className="h-16 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                         <Card>
                            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                            <CardContent className="space-y-4">
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-full" />
                                <Skeleton className="h-5 w-full" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    if (!order) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href={`/profile/orders`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t_profile.backToOrders}
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold mt-2">{t_profile.order} #{order.order_number}</h1>
                    <p className="text-muted-foreground">
                        {t.profile.placedOn} {format(new Date(order.created_at), 'PPp', { locale: bn })}
                    </p>
                </div>
                <Badge variant={getStatusBadgeVariant(order.status)} className="h-fit w-fit text-base">
                    {translateStatus(order.status)}
                </Badge>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2 grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> {t_profile.items}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.cart_items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                            <Image src={item.imageUrl || 'https://placehold.co/100x100'} alt={item.name} fill className="object-cover" />
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">{item.quantity} x {item.price.toFixed(2)} BDT</p>
                                        </div>
                                        <p className="font-medium">{(item.quantity * item.price).toFixed(2)} BDT</p>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-6" />
                            <div className="space-y-2 text-right">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t_profile.subtotal}</span>
                                    <span>{subtotal.toFixed(2)} BDT</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t_profile.shipping} ({order.shipping_info.shipping_method_name || 'N/A'})</span>
                                    <span>{(order.shipping_info.shipping_cost || 0).toFixed(2)} BDT</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg">
                                    <span>{t_profile.total}</span>
                                    <span>{order.total.toFixed(2)} BDT</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-1 grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {t_profile.customerInfo}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <p className="font-semibold text-foreground">{order.shipping_info.name}</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <Mail className="h-4 w-4 mt-0.5" />
                                <p>{order.customer_email}</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <p>{order.shipping_info.address}, {order.shipping_info.city}</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <Phone className="h-4 w-4 mt-0.5" />
                                <p>{order.shipping_info.phone}</p>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
    );
}
