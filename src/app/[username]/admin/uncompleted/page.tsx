'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Mail, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 10;

export default function UncompletedOrdersPage() {
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [uncompletedOrders, setUncompletedOrders] = useState<UncompletedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    const fetchUncompletedOrders = useCallback(async () => {
        if (!user) return;

        try {
            const response = await fetch('/api/uncompleted-orders/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setUncompletedOrders(result.orders || []);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error fetching data',
                description: error.message,
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    const markAsViewed = useCallback(async () => {
        if (!user) return;
        try {
            await fetch('/api/uncompleted-orders/mark-viewed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId: user.id }),
            });
        } catch (error) {
            console.error('Failed to mark as viewed:', error);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchUncompletedOrders();
            markAsViewed();
        } else if (!authLoading && !user) {
            setIsLoading(false);
        }
    }, [user, authLoading, fetchUncompletedOrders, markAsViewed]);
    
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

    const totalPages = Math.ceil(uncompletedOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = useMemo(() => {
        return uncompletedOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [uncompletedOrders, currentPage]);

    if (isLoading && uncompletedOrders.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col items-start px-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Card>
                    <CardHeader className="p-0 border-b">
                        <div className="p-4 grid grid-cols-6 gap-4">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 grid grid-cols-6 gap-4 items-center border-b last:border-0">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
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
                                {paginatedOrders.map(order => (
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
                                                        <Link href={`/admin/uncompleted/${order.id}`}>
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
                        {paginatedOrders.map(order => (
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
                                                    <Link href={`/admin/uncompleted/${order.id}`}>
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
            {totalPages > 1 && (
                <CardFooter className="flex justify-center gap-4 py-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        আগেরটি
                    </Button>
                    <div className="text-sm font-medium">পৃষ্ঠা {currentPage} / {totalPages}</div>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        পরবর্তী
                    </Button>
                </CardFooter>
            </Card>
    )
}
