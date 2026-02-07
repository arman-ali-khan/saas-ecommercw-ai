'use client';

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import { Eye, XCircle } from 'lucide-react';


// Mock data, in a real app this would come from an API
const orders = [
  { id: 'ORD001', date: '২০২৩-১০-২৬', total: 2150.00, status: 'বিতরণ করা হয়েছে', currency: 'BDT' },
  { id: 'ORD002', date: '২০২৩-১১-১৫', total: 850.00, status: 'প্রক্রিয়াকরণ চলছে', currency: 'BDT' },
  { id: 'ORD003', date: '২০২৩-১২-০১', total: 500.00, status: 'পাঠানো হয়েছে', currency: 'BDT' },
  { id: 'ORD004', date: '২০২৪-০১-০৫', total: 1250.00, status: 'বাতিল করা হয়েছে', currency: 'BDT' },
  { id: 'ORD005', date: '২০২৪-০২-২০', total: 3000.00, status: 'বিতরণ করা হয়েছে', currency: 'BDT' },
];

export default function OrdersPage() {
    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
          case 'বিতরণ করা হয়েছে':
            return 'default';
          case 'পাঠানো হয়েছে':
            return 'secondary';
          case 'প্রক্রিয়াকরণ চলছে':
            return 'outline';
          default:
            return 'destructive';
        }
      };
      
    const isCancellable = (status: string) => {
        return status === 'প্রক্রিয়াকরণ চলছে' || status === 'পাঠানো হয়েছে';
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>আমার অর্ডার</CardTitle>
                <CardDescription>আপনার সমস্ত অর্ডারের একটি তালিকা এখানে দেখুন।</CardDescription>
            </CardHeader>
            <CardContent>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>অর্ডার আইডি</TableHead>
                                <TableHead>তারিখ</TableHead>
                                <TableHead>স্ট্যাটাস</TableHead>
                                <TableHead>মোট</TableHead>
                                <TableHead className="text-right">কার্যকলাপ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium">{order.id}</TableCell>
                                    <TableCell>{order.date}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                    </TableCell>
                                    <TableCell>{order.total.toFixed(2)} {order.currency}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm">
                                            <Eye className="mr-2 h-4 w-4" />
                                            বিস্তারিত
                                        </Button>
                                        <Button variant="destructive" size="sm" disabled={!isCancellable(order.status)}>
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
                                    <CardTitle className="text-lg">{order.id}</CardTitle>
                                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                </div>
                                <CardDescription>{order.date}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="font-semibold text-lg text-right">{order.total.toFixed(2)} {order.currency}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="outline" size="sm">
                                    <Eye className="mr-2 h-4 w-4" />
                                    বিস্তারিত
                                </Button>
                                <Button variant="destructive" size="sm" disabled={!isCancellable(order.status)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    বাতিল
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
                 {orders.length === 0 && (
                    <p className="text-muted-foreground text-center py-8">আপনার কোনো অর্ডার নেই।</p>
                )}
            </CardContent>
        </Card>
    )
}
