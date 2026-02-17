
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

export default function OrdersPage() {
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
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customer.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching orders', description: error.message });
        } else {
            setOrders(data as Order[]);
        }
        setIsLoading(false);
    }, [customer, toast]);

    useEffect(() => {
        if (!customerLoading && customer) {
            fetchOrders();
        } else if (!customerLoading && !customer) {
            setIsLoading(false);
        }
    }, [customer, customerLoading, fetchOrders]);
    
    const translateStatus = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'pending': return 'পেন্ডিং';
            case 'approved': return 'অনুমোদিত';
            case 'processing': return 'প্রসেসিং চলছে';
            case 'packaging': return 'প্যাকেজিং চলছে';
            case 'send for delivery': return 'ডেলিভারির জন্য পাঠানো হয়েছে';
            case 'shipped': return 'পাঠানো হয়েছে'; // backwards compatibility
            case 'delivered': return 'বিতরণ করা হয়েছে';
            case 'canceled': return 'বাতিল করা হয়েছে';
            default: return status;
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
      
    const isCancellable = (status: string) => {
        return ['pending'].includes(status.toLowerCase());
    };

    const handleCancelOrder = async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'canceled' })
            .eq('id', orderId);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Error canceling order', description: error.message });
        } else {
            toast({ title: 'অর্ডার বাতিল করা হয়েছে' });
            fetchOrders(); // Refresh orders
        }
    };
    
    if (isLoading || customerLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>আমার অর্ডার</CardTitle>
                    <CardDescription>আপনার সব অর্ডারের একটি তালিকা এখানে দেখুন।</CardDescription>
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
                <CardTitle>আমার অর্ডার</CardTitle>
                <CardDescription>আপনার সব অর্ডারের একটি তালিকা এখানে দেখুন।</CardDescription>
            </CardHeader>
            <CardContent>
                {orders.length > 0 ? (
                <>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>অর্ডার আইডি</TableHead>
                                <TableHead>তারিখ</TableHead>
                                <TableHead>স্ট্যাটাস</TableHead>
                                <TableHead>মোট</TableHead>
                                <TableHead className="text-right">অ্যাকশন</TableHead>
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
                                                বিস্তারিত
                                            </Link>
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)} disabled={!isCancellable(order.status)}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            বাতিল
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
                                        বিস্তারিত
                                    </Link>
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleCancelOrder(order.id)} disabled={!isCancellable(order.status)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    বাতিল
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                </>
                ) : (
                    <p className="text-muted-foreground text-center py-8">আপনার কোনো অর্ডার নেই।</p>
                )}
            </CardContent>
        </Card>
    )
}
