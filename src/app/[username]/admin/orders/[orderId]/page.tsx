
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2, Package, User, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import { useAuth } from '@/stores/auth';

type Order = {
    id: string;
    order_number: string;
    customer_id: string | null;
    site_id: string;
    customer_email: string;
    shipping_info: {
        name: string;
        address: string;
        city: string;
        phone: string;
        notes?: string;
    };
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
    payment_method: string;
    transaction_id: string | null;
};

const orderStatuses = ['processing', 'shipped', 'delivered', 'canceled'];

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();

    const orderId = params.orderId as string;
    const username = params.username as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('');
    
    const fetchOrder = useCallback(async () => {
        if (!orderId || !user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'Order not found.' });
            router.push(`/${username}/admin/orders`);
            return;
        }
        setOrder(data as Order);
        setStatus(data.status);
        setIsLoading(false);
    }, [orderId, user, router, toast, username]);


    useEffect(() => {
        if(!authLoading) {
            fetchOrder();
        }
    }, [authLoading, fetchOrder]);
    
    const translateStatus = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'processing': return 'প্রক্রিয়াকরণ চলছে';
            case 'shipped': return 'পাঠানো হয়েছে';
            case 'delivered': return 'বিতরণ করা হয়েছে';
            case 'canceled': return 'বাতিল করা হয়েছে';
            default: return status;
        }
    };
    
    const formatPaymentMethod = (method: string) => {
        if (method === 'mobile_banking') return 'Mobile Banking';
        if (method === 'cod') return 'Cash on Delivery';
        return method;
    }

    const handleUpdateStatus = async () => {
        if (!order) return;
        setIsSubmitting(true);
        const { data: updatedOrder, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', order.id)
            .select()
            .single();
        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } else {
            toast({ title: 'Order status updated!' });
            setOrder(updatedOrder as Order);
            setStatus(updatedOrder.status);

            // --- Create notification for customer ---
            if (updatedOrder.customer_id) {
                const notificationMessage = `Your order #${updatedOrder.order_number} has been updated to: ${translateStatus(updatedOrder.status)}.`;
                const { error: notificationError } = await supabase
                    .from('notifications')
                    .insert({
                        recipient_id: updatedOrder.customer_id,
                        recipient_type: 'customer',
                        site_id: updatedOrder.site_id,
                        order_id: updatedOrder.id,
                        message: notificationMessage,
                        link: `/${username}/profile/orders`
                    });

                if (notificationError) {
                    console.error("Failed to create notification for customer:", notificationError.message);
                    // Don't show an error to the admin for this, just log it.
                }
            }
            // --- End notification ---
        }
    };

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'default';
            case 'shipped': return 'secondary';
            case 'processing': return 'outline';
            case 'canceled': return 'destructive';
            default: return 'outline';
        }
    };

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
                        <Link href={`/${username}/admin/orders`}>
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
                                    <span>{order.total.toFixed(2)} BDT</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-muted-foreground">শিপিং</span>
                                    <span>বিনামূল্যে</span>
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
                            <CardDescription>অর্ডারের বর্তমান অবস্থা পরিবর্তন করুন।</CardDescription>
                        </CardHeader>
                        <CardContent className="flex items-center gap-4">
                             <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="একটি স্ট্যাটাস নির্বাচন করুন" />
                                </SelectTrigger>
                                <SelectContent>
                                    {orderStatuses.map(s => (
                                        <SelectItem key={s} value={s}>
                                            {translateStatus(s)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={handleUpdateStatus} disabled={isSubmitting || status === order.status}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                সংরক্ষণ করুন
                            </Button>
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
