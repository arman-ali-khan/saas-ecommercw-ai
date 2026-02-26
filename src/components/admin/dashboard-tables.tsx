'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Eye, Star, AlertTriangle, TrendingUp, Users, MessageCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Order, ProductReview, ProductQna, Product } from '@/types';
import Image from 'next/image';

interface DashboardTablesProps {
  pendingOrders: Order[];
  lowStockProducts: Product[];
  pendingReviews: ProductReview[];
  unansweredQuestions: ProductQna[];
  topSellingProducts: any[];
  recentCustomers: any[];
  isLoading: boolean;
  t: any;
}

const TableSkeletonLoader = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-2 border rounded-md">
                <Skeleton className="h-8 flex-grow" />
                <Skeleton className="h-8 w-20" />
            </div>
        ))}
    </div>
);

export default function DashboardTables({ 
  pendingOrders, 
  lowStockProducts,
  pendingReviews, 
  unansweredQuestions, 
  topSellingProducts,
  recentCustomers,
  isLoading, 
  t 
}: DashboardTablesProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Selling Products Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /> সেরা বিক্রিত পণ্য</CardTitle>
              <CardDescription>সবচেয়ে বেশি বিক্রি হওয়া পণ্যগুলোর তালিকা।</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/products`}>সকল পণ্য</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeletonLoader /> : !topSellingProducts?.length ? <p className="text-muted-foreground text-center py-8">কোনো বিক্রয় তথ্য নেই।</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>পণ্য</TableHead>
                      <TableHead className="text-center">পরিমাণ</TableHead>
                      <TableHead className="text-right">মোট আয়</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellingProducts.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-md overflow-hidden border bg-muted">
                            <Image src={item.imageUrl || 'https://placehold.co/40x40'} alt={item.name} fill className="object-cover" />
                          </div>
                          <span className="text-xs font-bold truncate max-w-[120px]">{item.name}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-mono">{item.totalSold}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary text-xs">
                          ৳{item.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Customers Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" /> নতুন গ্রাহক</CardTitle>
              <CardDescription>আপনার স্টোরে সম্প্রতি যুক্ত হওয়া গ্রাহক।</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/customers`}>সকল গ্রাহক</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeletonLoader /> : !recentCustomers?.length ? <p className="text-muted-foreground text-center py-8">কোনো গ্রাহক পাওয়া যায়নি।</p> : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>নাম</TableHead>
                      <TableHead>তারিখ</TableHead>
                      <TableHead className="text-right">বিস্তারিত</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentCustomers.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-[10px]">{customer.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold truncate max-w-[120px]">{customer.full_name}</span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{customer.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">
                          {format(new Date(customer.created_at), 'PP')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/admin/customers/${customer.id}`}><Eye className="h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unanswered Q&A */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-amber-500" /> উত্তরহীন প্রশ্নসমূহ</CardTitle>
              <CardDescription>গ্রাহকদের করা প্রশ্নগুলোর উত্তর দিন।</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/qna`}>সকল প্রশ্ন</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeletonLoader /> : !unansweredQuestions?.length ? <p className="text-muted-foreground text-center py-8">সব প্রশ্নের উত্তর দেওয়া হয়েছে।</p> : (
              <div className="space-y-3">
                {unansweredQuestions.map(qna => (
                  <div key={qna.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col min-w-0 flex-1 mr-4">
                        <span className="text-xs font-bold truncate">Q: {qna.question}</span>
                        <span className="text-[10px] text-muted-foreground mt-1">Product ID: {qna.product_id} • By {qna.customer_name}</span>
                    </div>
                    <Button variant="secondary" size="sm" asChild className="h-8 px-3 rounded-lg shrink-0">
                      <Link href={`/admin/qna`}>
                        রিপ্লাই দিন
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> পেন্ডিং রিভিউ</CardTitle>
              <CardDescription>{t.reviewDesc}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/reviews`}>সকল রিভিউ</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeletonLoader /> : !pendingReviews?.length ? <p className="text-muted-foreground text-center py-8">{t.noPendingReviews}</p> : (
              <div className="space-y-3">
                {pendingReviews.map(reviewItemRecord => (
                  <div key={reviewItemRecord.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold">{reviewItemRecord.customer_name}</span>
                        <div className="flex items-center mt-0.5">
                            {[...Array(5)].map((_, starIndex) => (
                                <Star key={starIndex} className={cn("h-3 w-3", starIndex < reviewItemRecord.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                            ))}
                        </div>
                    </div>
                    <Button variant="secondary" size="sm" asChild className="h-9 px-4 rounded-lg">
                      <Link href={`/admin/reviews`}>
                        <Eye className="mr-2 h-4 w-4" /> {t.view}
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t.recentPending}</CardTitle>
              <CardDescription>{t.reviewProcess}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/orders`}>{t.viewAll} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeletonLoader /> : pendingOrders.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noPendingOrders}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Total</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {pendingOrders.map(orderItemRecord => (
                        <TableRow key={orderItemRecord.id}>
                          <TableCell className="font-mono text-xs">{orderItemRecord.order_number}</TableCell>
                          <TableCell className="text-xs font-bold">BDT {orderItemRecord.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/orders/${orderItemRecord.id}`}><Eye className="mr-2 h-4 w-4" />{t.details}</Link></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {pendingOrders.map(orderItemRecord => (
                    <div key={orderItemRecord.id} className="flex justify-between items-center p-3 border rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-xs font-mono">{orderItemRecord.order_number}</span>
                            <span className="text-sm font-bold">BDT {orderItemRecord.total.toFixed(2)}</span>
                        </div>
                        <Button variant="secondary" size="sm" asChild className="h-9 px-4 rounded-lg">
                          <Link href={`/admin/orders/${orderItemRecord.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> {t.view}
                          </Link>
                        </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card className="border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> {t.lowStock}</CardTitle>
              <CardDescription>{t.lowStockDesc}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/products`}>{t.viewAll}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeletonLoader /> : lowStockProducts.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.sufficientStock}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Stock Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {lowStockProducts.map(lowStockItemRecord => {
                        const hasVariants = lowStockItemRecord.variants && Array.isArray(lowStockItemRecord.variants) && lowStockItemRecord.variants.length > 0;
                        const calculatedMinimumAmount = hasVariants 
                            ? Math.min(...lowStockItemRecord.variants!.map((vItem: any) => vItem.stock ?? 0))
                            : (lowStockItemRecord.stock ?? 0);
                        
                        return (
                          <TableRow key={lowStockItemRecord.id}>
                            <TableCell className="text-xs font-medium max-w-[150px] truncate">
                                {lowStockItemRecord.name}
                                {hasVariants && <span className="text-[10px] text-muted-foreground block">(Multi-price)</span>}
                            </TableCell>
                            <TableCell>
                                <Badge variant={calculatedMinimumAmount === 0 ? "destructive" : "secondary"} className="text-[10px] uppercase font-black px-1.5 h-5">
                                    {calculatedMinimumAmount === 0 ? "Out" : `${calculatedMinimumAmount} Low`}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/products/${lowStockItemRecord.id}`}><Eye className="mr-2 h-4 w-4" /></Link></Button></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {lowStockProducts.map(lowStockItemRecord => {
                    const hasVariants = lowStockItemRecord.variants && Array.isArray(lowStockItemRecord.variants) && lowStockItemRecord.variants.length > 0;
                    const calculatedMinimumAmount = hasVariants 
                        ? Math.min(...lowStockItemRecord.variants!.map((vItem: any) => vItem.stock ?? 0))
                        : (lowStockItemRecord.stock ?? 0);
                    
                    return (
                        <div key={lowStockItemRecord.id} className="flex justify-between items-center p-3 border rounded-xl">
                            <div className="flex flex-col max-w-[150px]">
                                <span className="text-xs font-bold truncate">{lowStockItemRecord.name}</span>
                                <span className="text-[10px] text-muted-foreground">{hasVariants ? "Multi-price" : lowStockItemRecord.categories?.[0]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={calculatedMinimumAmount === 0 ? "destructive" : "secondary"} className="text-[10px] h-5">
                                    {calculatedMinimumAmount === 0 ? "Out" : `${calculatedMinimumAmount} Low`}
                                </Badge>
                                <Button variant="secondary" size="sm" asChild className="h-9 px-4 rounded-lg">
                                    <Link href={`/admin/products/${lowStockItemRecord.id}`}><Eye className="mr-2 h-4 w-4" /> {t.view}</Link>
                                </Button>
                            </div>
                        </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
