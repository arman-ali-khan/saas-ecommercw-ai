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
import { MoreHorizontal, Mail, Eye } from 'lucide-react';


// Mock data for uncompleted orders
const uncompletedOrders = [
  { id: 'CART001', customer: 'নাজিয়া হক', date: '২০২৪-০৭-২৫', value: 1800.00, status: 'চেকআউটে পৌঁছেছে', currency: 'BDT' },
  { id: 'CART002', customer: 'সাকিব খান', date: '২০২৪-০৭-২৪', value: 950.00, status: 'কার্টে যোগ করেছে', currency: 'BDT' },
  { id: 'CART003', customer: 'Unknown Visitor', date: '২০২৪-০৭-২৩', value: 350.00, status: 'কার্টে যোগ করেছে', currency: 'BDT' },
  { id: 'CART004', customer: 'ফারিহা ইসলাম', date: '২০২৪-০৭-২২', value: 5000.00, status: 'পেমেন্ট শুরু করেছে', currency: 'BDT' },
];

export default function UncompletedOrdersPage() {
    const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
        switch (status) {
          case 'পেমেন্ট শুরু করেছে':
            return 'default';
          case 'চেকআউটে পৌঁছেছে':
            return 'secondary';
          default:
            return 'outline';
        }
      };

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
                                        <TableCell className="font-medium">{order.id}</TableCell>
                                        <TableCell>{order.customer}</TableCell>
                                        <TableCell>{order.date}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                        </TableCell>
                                        <TableCell>{order.value.toFixed(2)} {order.currency}</TableCell>
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
                                                        কার্ট দেখুন
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem disabled={order.customer === 'Unknown Visitor'}>
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
                                                    কার্ট দেখুন
                                                </DropdownMenuItem>
                                                <DropdownMenuItem disabled={order.customer === 'Unknown Visitor'}>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    অনুস্মারক ইমেল পাঠান
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardDescription className="pt-2">{order.date}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                                    <p className="font-semibold text-lg">{order.value.toFixed(2)} {order.currency}</p>
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
