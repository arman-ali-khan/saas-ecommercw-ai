'use client';

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
import { MoreHorizontal, Eye, Truck, CheckCircle } from 'lucide-react';


// Mock data, in a real app this would come from an API
const orders = [
  { id: 'ORD001', customer: 'আরিফুল ইসলাম', date: '২০২৩-১০-২৬', total: 2150.00, status: 'বিতরণ করা হয়েছে', currency: 'BDT' },
  { id: 'ORD002', customer: 'সুমাইয়া খাতুন', date: '২০২৩-১১-১৫', total: 850.00, status: 'প্রক্রিয়াকরণ চলছে', currency: 'BDT' },
  { id: 'ORD003', customer: 'রাশেদ আহমেদ', date: '২০২৩-১২-০১', total: 500.00, status: 'পাঠানো হয়েছে', currency: 'BDT' },
  { id: 'ORD004', customer: 'জান্নাতুল ফেরদৌস', date: '২০২৪-০১-০৫', total: 1250.00, status: 'বাতিল করা হয়েছে', currency: 'BDT' },
  { id: 'ORD005', customer: 'মোঃ হাসান', date: '২০২৪-০২-২০', total: 3000.00, status: 'বিতরণ করা হয়েছে', currency: 'BDT' },
];

export default function OrdersAdminPage() {
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

    return (
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
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>{order.customer}</TableCell>
                                        <TableCell>{order.date}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                        </TableCell>
                                        <TableCell>{order.total.toFixed(2)} {order.currency}</TableCell>
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
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        অর্ডার দেখুন
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <Truck className="mr-2 h-4 w-4" />
                                                        স্ট্যাটাস আপডেট
                                                    </DropdownMenuItem>
                                                     <DropdownMenuItem>
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
                                            <CardTitle className="text-lg">{order.id}</CardTitle>
                                            <CardDescription>{order.customer}</CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    অর্ডার দেখুন
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Truck className="mr-2 h-4 w-4" />
                                                    স্ট্যাটাস আপডেট
                                                </DropdownMenuItem>
                                                 <DropdownMenuItem>
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    সম্পন্ন হিসেবে চিহ্নিত করুন
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription className="pt-2">{order.date}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                    <p className="font-semibold text-lg">{order.total.toFixed(2)} {order.currency}</p>
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
    )
}
