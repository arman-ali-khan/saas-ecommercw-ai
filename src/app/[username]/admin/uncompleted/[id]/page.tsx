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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Package, User, MapPin, Phone, Mail } from 'lucide-react';
import type { UncompletedOrder } from '@/types';
import { useAuth } from '@/stores/auth';

export default function UncompletedOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();

    const id = params.id as string;
    const username = params.username as string;

    const [order, setOrder] = useState<UncompletedOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchOrder = useCallback(async () => {
        if (!id || !user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('uncompleted_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            toast({ variant: 'destructive', title: 'Error', description: 'Uncompleted order not found.' });
            router.push(`/${username}/admin/uncompleted`);
            return;
        }
        setOrder(data as UncompletedOrder);
        setIsLoading(false);
    }, [id, user, router, toast, username]);

    useEffect(() => {
        if(!authLoading) {
            fetchOrder();
        }
    }, [authLoading, fetchOrder]);
    
    const translateStatus = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'shipping-info-entered': return 'চেকআউটে পৌঁছেছে';
            case 'cart-created': return 'কার্টে যোগ করেছে';
            case 'payment-started': return 'পেমেন্ট শুরু করেছে';
            default: return status;
        }
    };

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status.toLowerCase()) {
            case 'payment-started': return 'default';
            case 'shipping-info-entered': return 'secondary';
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

    const cartId = order.id.split('-')[0].toUpperCase();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href={`/${username}/admin/uncompleted`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Uncompleted Orders
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold mt-2">অসম্পূর্ণ অর্ডার #{cartId}</h1>
                    <p className="text-muted-foreground">
                        {format(new Date(order.created_at), 'PPp')} তারিখে শুরু হয়েছে।
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
                            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> কার্টের পণ্যসমূহ</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(order.cart_items || []).map(item => (
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
                                 <div className="flex justify-between font-bold text-lg">
                                    <span>মোট</span>
                                    <span>{order.cart_total.toFixed(2)} BDT</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                 <div className="lg:col-span-1 grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> গ্রাহকের তথ্য</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <div className="flex items-start gap-2">
                                <p className="font-semibold text-foreground">{order.customer_info?.name || "নাম পাওয়া যায়নি"}</p>
                            </div>
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5" />
                                <p>{order.customer_info?.address && order.customer_info?.city ? `${order.customer_info.address}, ${order.customer_info.city}`: "ঠিকানা পাওয়া যায়নি"}</p>
                            </div>
                             <div className="flex items-center justify-between">
                                <div className="flex items-start gap-2">
                                    <Phone className="h-4 w-4 mt-0.5" />
                                    <p>{order.customer_info?.phone || "ফোন নম্বর পাওয়া যায়নি"}</p>
                                </div>
                                {order.customer_info?.phone && (
                                    <Button asChild variant="outline" size="sm">
                                        <a href={`tel:${order.customer_info.phone}`}>
                                            <Phone className="mr-2 h-4 w-4" />
                                            Call
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Button disabled={!order.customer_info?.name || order.customer_info.name === 'Unknown Visitor'}>
                        <Mail className="mr-2 h-4 w-4" />
                        অনুস্মারক ইমেল পাঠান
                    </Button>
                 </div>
            </div>
        </div>
    );
}
