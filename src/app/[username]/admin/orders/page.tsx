
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/stores/auth';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Truck, CheckCircle, Loader2 } from 'lucide-react';

type Order = {
    id: string;
    order_number: string;
    shipping_info: {
        name: string;
        address: string;
        city: string;
        phone: string;
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
};

const orderStatuses = ['processing', 'shipped', 'delivered', 'canceled'];

export default function OrdersAdminPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    const fetchOrders = async () => {
        if (!user?.id) return;
        const { data, error } = await supabase
            .from('orders')
            .select('id, order_number, shipping_info, created_at, total, status, cart_items')
            .eq('site_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ variant: 'destructive', title: "Failed to fetch orders:", description: error.message });
        } else if (data) {
            setOrders(data as Order[]);
        }
    };

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            fetchOrders().finally(() => setIsLoading(false));
        }
    }, [user]);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const handleUpdateStatusClick = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setIsStatusModalOpen(true);
    };

    const handleMarkAsCompleted = async (orderId: string) => {
        const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);
        if (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } else {
            toast({ title: 'Order marked as delivered!' });
            await fetchOrders();
        }
    };

    const handleSaveStatus = async () => {
        if (!selectedOrder || !newStatus) return;
        setIsSubmitting(true);
        const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', selectedOrder.id);
        setIsSubmitting(false);

        if (error) {
            toast({ variant: 'destructive', title: 'Error updating status', description: error.message });
        } else {
            toast({ title: 'Order status updated!' });
            await fetchOrders();
            setIsStatusModalOpen(false);
            setSelectedOrder(null);
        }
    };
    
    const translateStatus = (status: string): string => {
        switch (status.toLowerCase()) {
            case 'processing': return 'প্রক্রিয়াকরণ চলছে';
            case 'shipped': return 'পাঠানো হয়েছে';
            case 'delivered': return 'বিতরণ করা হয়েছে';
            case 'canceled': return 'বাতিল করা হয়েছে';
            default: return status;
        }
    };

    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status.toLowerCase()) {
          case 'delivered':
            return 'default';
          case 'shipped':
            return 'secondary';
          case 'processing':
            return 'outline';
          case 'canceled':
            return 'destructive';
          default:
            return 'outline';
        }
    };
    
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>অর্ডার ব্যবস্থাপনা</CardTitle>
                    <CardDescription>সমস্ত গ্রাহকের অর্ডার দেখুন এবং পরিচালনা করুন।</CardDescription>
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
                    <CardTitle>অর্ডার ব্যবস্থাপনা</CardTitle>
                    <CardDescription>সমস্ত গ্রাহকের অর্ডার দেখুন এবং পরিচালনা করুন।</CardDescription>
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
                                        <TableHead>গ্রাহক</TableHead>
                                        <TableHead>তারিখ</TableHead>
                                        <TableHead>স্ট্যাটাস</TableHead>
                                        <TableHead>মোট</TableHead>
                                        <TableHead className="text-right">কার্যকলাপ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map(order => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{order.order_number}</TableCell>
                                            <TableCell>{order.shipping_info?.name || 'Guest'}</TableCell>
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
                                                            <span className="sr-only">মেনু</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>কার্যকলাপ</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            অর্ডার দেখুন
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateStatusClick(order)}>
                                                            <Truck className="mr-2 h-4 w-4" />
                                                            স্ট্যাটাস আপডেট
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleMarkAsCompleted(order.id)}
                                                            disabled={order.status === 'delivered' || order.status === 'canceled'}
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />
                                                            সম্পন্ন হিসেবে চিহ্নিত করুন
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
                            {orders.map(order => (
                                <Card key={order.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{order.order_number}</CardTitle>
                                                <CardDescription>{order.shipping_info?.name || 'Guest'}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewDetails(order)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        অর্ডার দেখুন
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatusClick(order)}>
                                                        <Truck className="mr-2 h-4 w-4" />
                                                        স্ট্যাটাস আপডেট
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleMarkAsCompleted(order.id)}
                                                        disabled={order.status === 'delivered' || order.status === 'canceled'}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        সম্পন্ন হিসেবে চিহ্নিত করুন
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
                        <p className="text-muted-foreground text-center py-8">কোনো অর্ডার পাওয়া যায়নি।</p>
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>অর্ডার #{selectedOrder?.order_number}</DialogTitle>
                        <DialogDescription>
                            {selectedOrder?.shipping_info.name} কর্তৃক {selectedOrder ? format(new Date(selectedOrder.created_at), 'PPp') : ''} তারিখে দেওয়া হয়েছে।
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <h4 className="font-semibold">গ্রাহকের বিবরণ</h4>
                            <p className="text-muted-foreground text-sm">
                                {selectedOrder?.shipping_info.name}<br />
                                {selectedOrder?.shipping_info.address}, {selectedOrder?.shipping_info.city}<br />
                                {selectedOrder?.shipping_info.phone}
                            </p>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <h4 className="font-semibold">অর্ডার করা পণ্য</h4>
                            {selectedOrder?.cart_items.map(item => (
                                <div key={item.id} className="flex items-center gap-4">
                                    <div className="relative h-14 w-14 rounded-md overflow-hidden border">
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
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>মোট</span>
                            <span>{selectedOrder?.total.toFixed(2)} BDT</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Update Status Dialog */}
            <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>স্ট্যাটাস আপডেট করুন</DialogTitle>
                        <DialogDescription>অর্ডার #{selectedOrder?.order_number} এর জন্য একটি নতুন স্ট্যাটাস নির্বাচন করুন।</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label htmlFor="status-select">অর্ডারের স্ট্যাটাস</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger id="status-select">
                                <SelectValue placeholder="একটি স্ট্যাটাস নির্বাচন করুন" />
                            </SelectTrigger>
                            <SelectContent>
                                {orderStatuses.map(status => (
                                    <SelectItem key={status} value={status}>
                                        {translateStatus(status)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>বাতিল</Button>
                        <Button onClick={handleSaveStatus} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            সংরক্ষণ করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

    