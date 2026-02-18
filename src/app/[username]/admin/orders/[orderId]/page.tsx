
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
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
import { ArrowLeft, Loader2, Package, User, MapPin, Phone, Mail, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import type { Order } from '@/types';

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();

    const orderId = params.orderId as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionTarget, setActionTarget] = useState<string | null>(null);
    
    const translateStatus = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'pending': return 'পেন্ডিং';
            case 'approved': return 'অনুমোদিত';
            case 'processing': return 'প্রক্রিয়াকরণ চলছে';
            case 'packaging': return 'প্যাকেজিং চলছে';
            case 'send for delivery': return 'ডেলিভারির জন্য পাঠানো হয়েছে';
            case 'shipped': return 'পাঠানো হয়েছে';
            case 'delivered': return 'বিতরণ করা হয়েছে';
            case 'canceled': return 'বাতিল করা হয়েছে';
            default: return status;
        }
    };

    const fetchOrder = useCallback(async () => {
        if (!orderId || !user) return;
        setIsLoading(true);
        try {
            const response = await fetch('/api/orders/get', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setOrder(result.order as Order);
            } else {
                throw new Error(result.error || 'Order not found');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
            router.push(`/admin/orders`);
        } finally {
            setIsLoading(false);
        }
    }, [orderId, user, router, toast]);


    useEffect(() => {
        if(!authLoading) {
            fetchOrder();
        }
    }, [authLoading, fetchOrder]);
    
    const formatPaymentMethod = (method: string) => {
        if (method === 'mobile_banking') return 'Mobile Banking';
        if (method === 'cod') return 'Cash on Delivery';
        return method;
    }

    const handleUpdateStatus = async (newStatus: string) => {
        if (!order) return;
        setIsActionLoading(true);
        setActionTarget(newStatus);
        
        try {
            const response = await fetch('/api/orders/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id, newStatus }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update order status');
            }
            
            toast({ title: 'Order status updated!' });
            setOrder(result.order as Order);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } finally {
            setIsActionLoading(false);
            setActionTarget(null);
        }
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

    if (!order) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href={`/admin/orders`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Orders
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold mt-2">অর্ডার #{order.order_number}</h1>
                    <p className="text-muted-foreground">
                        {format(new Date(order.created_at), 'PPp')} তারিখে দেওয়া হয়েছে।
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
                            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> পণ্য সামগ্রী</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.cart_items.map(item => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
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
                                    <span className="text-muted-foreground">উপমোট</span>
                                    <span>{subtotal.toFixed(2)} BDT</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">শিপিং ({order.shipping_info.shipping_cost || 0} BDT)</span>
                                    <span>{(order.shipping_info.shipping_cost || 0).toFixed(2)} BDT</span>
                                </div>
                                 <div className="flex justify-between font-bold text-lg">
                                    <span>মোট</span>
                                    <span>{order.total.toFixed(2)} BDT</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>স্ট্যাটাস আপডেট করুন</CardTitle>
                            <CardDescription>অর্ডারটিকে পরবর্তী ধাপে নিয়ে যান।</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap items-center gap-4">
                            {order.status === 'pending' && (
                                <Button onClick={() => handleUpdateStatus('approved')} disabled={isActionLoading}>
                                    {isActionLoading && actionTarget === 'approved' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    অর্ডার অনুমোদন করুন
                                </Button>
                            )}
                            {order.status === 'approved' && (
                                <Button onClick={() => handleUpdateStatus('processing')} disabled={isActionLoading}>
                                    {isActionLoading && actionTarget === 'processing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    প্রসেসিং শুরু করুন
                                </Button>
                            )}
                            {order.status === 'processing' && (
                                <Button onClick={() => handleUpdateStatus('packaging')} disabled={isActionLoading}>
                                    {isActionLoading && actionTarget === 'packaging' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    প্যাকেজিং এর জন্য প্রস্তুত
                                </Button>
                            )}
                             {order.status === 'packaging' && (
                                <Button onClick={() => handleUpdateStatus('send for delivery')} disabled={isActionLoading}>
                                    {isActionLoading && actionTarget === 'send for delivery' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    ডেলিভারির জন্য পাঠান
                                </Button>
                            )}
                            {(order.status === 'shipped' || order.status === 'send for delivery') && (
                                <Button onClick={() => handleUpdateStatus('delivered')} disabled={isActionLoading}>
                                    {isActionLoading && actionTarget === 'delivered' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    ডেলিভারি সম্পন্ন
                                </Button>
                            )}

                            {order.status === 'delivered' && (
                                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    অর্ডার সম্পন্ন হয়েছে
                                </div>
                            )}
                            
                            {order.status !== 'delivered' && order.status !== 'canceled' && (
                                <Button variant="destructive" onClick={() => handleUpdateStatus('canceled')} disabled={isActionLoading}>
                                    {isActionLoading && actionTarget === 'canceled' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    অর্ডার বাতিল করুন
                                </Button>
                            )}

                            {order.status === 'canceled' && (
                                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                                    <XCircle className="h-5 w-5" />
                                    অর্ডার বাতিল করা হয়েছে
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-1 grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> গ্রাহক</CardTitle>
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-2">
                                    <Phone className="h-4 w-4 mt-0.5" />
                                    <p>{order.shipping_info.phone}</p>
                                </div>
                                {order.shipping_info.phone &&
                                    <Button asChild variant="outline" size="sm">
                                        <a href={`tel:${order.shipping_info.phone}`}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Call
                                        </a>
                                    </Button>
                                }
                            </div>
                             {order.shipping_info.notes && (
                                <div className="pt-4 border-t mt-4">
                                    <p className="font-semibold text-foreground">Order Note:</p>
                                    <p className="text-muted-foreground whitespace-pre-wrap">{order.shipping_info.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Payment Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><strong>Payment Method:</strong> {formatPaymentMethod(order.payment_method)}</p>
                            {order.transaction_id && (
                                <p><strong>Transaction ID:</strong> <span className="font-mono text-xs bg-muted p-1 rounded-sm">{order.transaction_id}</span></p>
                            )}
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
    );
}
