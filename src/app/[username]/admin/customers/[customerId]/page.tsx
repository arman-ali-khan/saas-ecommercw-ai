'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, User, MapPin, Phone, Mail, ShoppingBag, DollarSign, Home, Briefcase, Building, Eye } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import type { Order, Address } from '@/types';

type CustomerProfile = {
    id: string;
    full_name: string;
    email: string;
    created_at: string;
};

const StatCard = ({ title, value, icon: Icon, isLoading }: { title: string, value: string, icon: React.ElementType, isLoading?: boolean }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <div className="h-7 w-24 bg-muted animate-pulse rounded-md" /> : <div className="text-2xl font-bold">{value}</div>}
        </CardContent>
    </Card>
);

const AddressIcon = ({type}: {type: string | null}) => {
    if (type === 'home') return <Home className="h-5 w-5 text-muted-foreground" />
    if (type === 'work') return <Briefcase className="h-5 w-5 text-muted-foreground" />
    return <Building className="h-5 w-5 text-muted-foreground" />;
}

export default function CustomerDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const customerId = params.customerId as string;

    const [customer, setCustomer] = useState<CustomerProfile | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!customerId || !user) return;
        setIsLoading(true);

        const customerPromise = supabase.from('customer_profiles').select('*').eq('id', customerId).eq('site_id', user.id).single();
        const ordersPromise = supabase.from('orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
        const addressesPromise = supabase.from('customer_addresses').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });

        const [
            { data: customerData, error: customerError },
            { data: ordersData, error: ordersError },
            { data: addressesData, error: addressesError },
        ] = await Promise.all([customerPromise, ordersPromise, addressesPromise]);

        if (customerError || !customerData) {
            toast({ variant: 'destructive', title: 'Error', description: 'Customer not found.' });
            router.push(`/admin/customers`);
            return;
        }

        if (ordersError) toast({ variant: 'destructive', title: 'Error fetching orders' });
        if (addressesError) toast({ variant: 'destructive', title: 'Error fetching addresses' });

        setCustomer(customerData as CustomerProfile);
        setOrders(ordersData as Order[] || []);
        setAddresses(addressesData as Address[] || []);
        setIsLoading(false);
    }, [customerId, user, router, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        }
    }, [authLoading, user, fetchData]);

    const stats = useMemo(() => {
        const totalSpent = orders.reduce((acc, order) => acc + (order.status !== 'canceled' ? order.total : 0), 0);
        const totalOrders = orders.filter(o => o.status !== 'canceled').length;
        return {
            totalOrders: totalOrders.toString(),
            totalSpent: `৳${totalSpent.toFixed(2)}`,
        }
    }, [orders]);

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status.toLowerCase()) {
            case 'delivered': return 'default';
            case 'send for delivery': return 'secondary';
            case 'approved': return 'secondary';
            case 'pending': return 'outline';
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
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                         <Skeleton className="h-40 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!customer) return null;

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <Button variant="ghost" asChild className="-ml-4">
                        <Link href={`/admin/customers`}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers</Link>
                    </Button>
                    <div className="flex items-center gap-4 mt-2">
                        <Avatar className="h-16 w-16 text-3xl"><AvatarFallback>{customer.full_name.charAt(0)}</AvatarFallback></Avatar>
                        <div>
                            <h1 className="text-2xl font-bold">{customer.full_name}</h1>
                            <p className="text-muted-foreground">Joined on {format(new Date(customer.created_at), 'PP')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingBag} isLoading={isLoading} />
                <StatCard title="Total Spent" value={stats.totalSpent} icon={DollarSign} isLoading={isLoading} />
            </div>

            <div className="grid gap-8 lg:grid-cols-3 items-start">
                <div className="lg:col-span-2 grid gap-6">
                     <Card>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {orders.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">View</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.slice(0, 5).map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium">{order.order_number}</TableCell>
                                                <TableCell>{format(new Date(order.created_at), 'P')}</TableCell>
                                                <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                                                <TableCell className="text-right">{order.total.toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button asChild variant="ghost" size="icon">
                                                        <Link href={`/admin/orders/${order.id}`}><Eye className="h-4 w-4" /></Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-muted-foreground text-center py-8">This customer has not placed any orders yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 grid gap-6">
                    <Card>
                        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-3"><Mail className="h-4 w-4" /><p>{customer.email}</p></div>
                            <div className="flex items-center gap-3"><Phone className="h-4 w-4" /><p>{orders[0]?.shipping_info.phone || 'N/A'}</p></div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Saved Addresses</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {addresses.length > 0 ? addresses.map(address => (
                                <div key={address.id} className="border p-3 rounded-md">
                                    <div className="flex items-center gap-2 font-semibold"><AddressIcon type={address.type} />{address.name}</div>
                                    <p className="text-sm text-muted-foreground pl-7">{address.details}</p>
                                </div>
                            )) : <p className="text-muted-foreground text-sm text-center">No saved addresses.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
