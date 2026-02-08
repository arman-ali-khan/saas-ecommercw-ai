'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Loader2, MoreHorizontal, Mail, Phone, Eye } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type OrderFromDB = {
    id: string;
    shipping_info: {
        name: string;
        address: string;
        city: string;
        phone: string;
    };
    total: number;
    user_id: string | null;
};

type Customer = {
    identifier: string;
    name: string;
    phone: string;
    email: string | null; // Assuming email is not yet available, but preparing for it
    orderIds: string[];
    totalSpent: number;
    orderCount: number;
}

export default function CustomersAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAndProcessCustomers = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        const { data, error } = await supabase
            .from('orders')
            .select('id, shipping_info, total, user_id')
            .eq('site_id', user.id);

        if (error) {
            toast({ variant: 'destructive', title: 'Error fetching customer data', description: error.message });
            setIsLoading(false);
            return;
        }

        const customerMap = new Map<string, Customer>();

        data.forEach((order: OrderFromDB) => {
            const info = order.shipping_info;
            if (!info || !info.name) return;

            // Use phone number as the primary unique identifier for a customer.
            const identifier = info.phone || `${info.name}-${info.address}`;
            
            if (customerMap.has(identifier)) {
                const existing = customerMap.get(identifier)!;
                existing.orderCount++;
                existing.totalSpent += order.total;
                existing.orderIds.push(order.id);
            } else {
                customerMap.set(identifier, {
                    identifier: identifier,
                    name: info.name,
                    phone: info.phone,
                    email: null, // Placeholder for now
                    orderCount: 1,
                    totalSpent: order.total,
                    orderIds: [order.id]
                });
            }
        });
        
        const processedCustomers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
        setCustomers(processedCustomers);
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchAndProcessCustomers();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchAndProcessCustomers]);
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>গ্রাহক ব্যবস্থাপনা</CardTitle>
                    <CardDescription>আপনার দোকানে যারা কেনাকাটা করেছেন তাদের দেখুন।</CardDescription>
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
                <CardTitle>গ্রাহক ব্যবস্থাপনা</CardTitle>
                <CardDescription>
                    আপনার দোকানের সমস্ত গ্রাহকদের একটি তালিকা। মোট {customers.length} জন গ্রাহক।
                </CardDescription>
            </CardHeader>
            <CardContent>
                {customers.length === 0 ? (
                     <div className="text-center py-16">
                        <p className="text-muted-foreground">কোনো গ্রাহকের তথ্য পাওয়া যায়নি।</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop View */}
                        <div className="hidden md:block">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>গ্রাহক</TableHead>
                                        <TableHead>ফোন</TableHead>
                                        <TableHead>মোট অর্ডার</TableHead>
                                        <TableHead>মোট খরচ</TableHead>
                                        <TableHead className="text-right">কার্যকলাপ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.map(customer => (
                                        <TableRow key={customer.identifier}>
                                            <TableCell className="font-medium flex items-center gap-3">
                                                 <Avatar className="h-9 w-9">
                                                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {customer.name}
                                            </TableCell>
                                            <TableCell>{customer.phone || 'N/A'}</TableCell>
                                            <TableCell>{customer.orderCount}</TableCell>
                                            <TableCell>{customer.totalSpent.toFixed(2)} BDT</TableCell>
                                            <TableCell className="text-right">
                                                {/* Actions can be added here, e.g., view customer's orders */}
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="mr-2 h-4 w-4" /> বিস্তারিত দেখুন
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        {/* Mobile View */}
                        <div className="grid gap-4 md:hidden">
                            {customers.map(customer => (
                                <Card key={customer.identifier}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                 <Avatar>
                                                    <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-lg">{customer.name}</CardTitle>
                                                    <CardDescription>{customer.phone || 'ফোন নম্বর নেই'}</CardDescription>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" /> বিস্তারিত দেখুন
                                                    </DropdownMenuItem>
                                                    {customer.phone && (
                                                         <DropdownMenuItem asChild>
                                                            <a href={`tel:${customer.phone}`}>
                                                                <Phone className="mr-2 h-4 w-4" /> Call
                                                            </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="text-muted-foreground">মোট অর্ডার</p>
                                            <p className="font-semibold">{customer.orderCount}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-muted-foreground">মোট খরচ</p>
                                            <p className="font-semibold">{customer.totalSpent.toFixed(2)} BDT</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
