'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { UncompletedOrder } from '@/types';

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
import { MoreHorizontal, Mail, Eye, Loader2 } from 'lucide-react';


export default function UncompletedOrdersPage() {
    const params = useParams();
    const username = params.username as string;
    const { user } = useAuth();
    const { toast } = useToast();
    const [uncompletedOrders, setUncompletedOrders] = useState<UncompletedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchUncompletedOrders = async () => {
            if (!user) return;
            setIsLoading(true);

            const { data, error } = await supabase
                .from('uncompleted_orders')
                .select('*')
                .eq('site_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                toast({
                    variant: 'destructive',
                    title: 'Error fetching data',
                    description: error.message,
                });
            } else if (data) {
                setUncompletedOrders(data as UncompletedOrder[]);
            }
            setIsLoading(false);
        };

        if (user) {
            fetchUncompletedOrders();
        }
    }, [user, toast]);
    
    const translateStatus = (status: string): string => {
        switch (status) {
            case 'shipping-info-entered': return 'চেকআউটে পৌঁছেছে';
            case 'cart-created': return 'কার্টে যোগ করেছে';
            case 'payment-started': return 'পেমেন্ট শুরু করেছে';
            default: return status;
        }
    };
    
    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
          case 'shipping-info-entered':
            return 'secondary';
          case 'payment-started':
            return 'default';
          default:
            return 'outline';
        }
      };

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>অসম্পূর্ণ অর্ডার</CardTitle>
                    <CardDescription>যেসব অর্ডার শুরু হয়েছে কিন্তু সম্পূর্ণ হয়নি সেগুলো দেখুন এবং পরিচালনা করুন।</CardDescription>
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
                <CardTitle>অসম্পূর্ণ অর্ডার</CardTitle>
                <CardDescription>যেসব অর্ডার শুরু হয়েছে কিন্তু সম্পূর্ণ হয়নি সেগুলো দেখুন এবং পরিচালনা করুন।</CardDescription>
            </CardHeader>
            <CardContent>
                {uncompletedOrders.length > 0 ? (
                  <>
                    {/* Desktop View: Table */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>কার্ট আইডি</TableHead>
                                    <TableHead>গ্রাহক</TableHead>
                                    <TableHead>তারিখ</TableHead>
                                    <TableHead>স্ট্যাটাস</TableHead>
                                    <TableHead>কার্টের মূল্য</TableHead>
                                    <TableHead className="text-right">কার্যকলাপ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {uncompletedOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-medium font-mono text-xs">{order.id.split('-')[0]}</TableCell>
                                        <TableCell>{order.customer_info?.name || 'Unknown Visitor'}</TableCell>
                                        <TableCell>{format(new Date(order.created_at), 'PP')}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                        </TableCell>
                                        <TableCell>{order.cart_total.toFixed(2)} BDT</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">মেনু</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>কার্যকলাপ</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/${username}/admin/uncompleted/${order.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            বিস্তারিত দেখুন
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled={!order.customer_info?.name || order.customer_info.name === 'Unknown Visitor'}>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        অনুস্মারক ইমেল পাঠান
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View: Cards */}
                    <div className="grid gap-4 md:hidden">
                        {uncompletedOrders.map(order => (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-sm font-mono">{order.id.split('-')[0]}</CardTitle>
                                            <CardDescription>{order.customer_info?.name || 'Unknown Visitor'}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/${username}/admin/uncompleted/${order.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        বিস্তারিত দেখুন
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled={!order.customer_info?.name || order.customer_info.name === 'Unknown Visitor'}>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    অনুস্মারক ইমেল পাঠান
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription className="pt-2">{format(new Date(order.created_at), 'PP')}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <Badge variant={getStatusBadgeVariant(order.status)}>{translateStatus(order.status)}</Badge>
                                    <p className="font-semibold text-lg">{order.cart_total.toFixed(2)} BDT</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                  </>
                ) : (
                    <p className="text-muted-foreground text-center py-8">কোনো অসম্পূর্ণ অর্ডার পাওয়া যায়নি।</p>
                )}
            </CardContent>
        </Card>
    )
}
