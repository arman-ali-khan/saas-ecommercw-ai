
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Eye, Star, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order, ProductReview, ProductQna, Product } from '@/types';

interface DashboardTablesProps {
  pendingOrders: Order[];
  lowStockProducts: Product[];
  pendingReviews: ProductReview[];
  unansweredQuestions: ProductQna[];
  isLoading: boolean;
  t: any;
}

const TableSkeleton = () => (
    <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-2 border rounded-md">
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
  isLoading, 
  t 
}: DashboardTablesProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Orders Table */}
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
            {isLoading ? <TableSkeleton /> : pendingOrders.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noPendingOrders}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Total</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {pendingOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                          <TableCell className="text-xs font-bold">BDT {order.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4" />{t.details}</Link></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="flex justify-between items-center p-3 border rounded-xl">
                        <div className="flex flex-col">
                            <span className="text-xs font-mono">{order.order_number}</span>
                            <span className="text-sm font-bold">BDT {order.total.toFixed(2)}</span>
                        </div>
                        <Button variant="secondary" size="sm" asChild><Link href={`/admin/orders/${order.id}`}>{t.view}</Link></Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Table */}
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
            {isLoading ? <TableSkeleton /> : lowStockProducts.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.sufficientStock}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Stock</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {lowStockProducts.map(prod => {
                        const minStock = Math.min(prod.stock ?? 0, ...(prod.variants?.map((v: any) => v.stock ?? 0) || []));
                        return (
                          <TableRow key={prod.id}>
                            <TableCell className="text-xs font-medium max-w-[150px] truncate">{prod.name}</TableCell>
                            <TableCell>
                                <Badge variant={minStock === 0 ? "destructive" : "secondary"} className="text-[10px] uppercase font-black px-1.5 h-5">
                                    {minStock === 0 ? "Out" : `${minStock} Low`}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/products/${prod.id}`}><Eye className="mr-2 h-4 w-4" /></Link></Button></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {lowStockProducts.map(prod => {
                    const minStock = Math.min(prod.stock ?? 0, ...(prod.variants?.map((v: any) => v.stock ?? 0) || []));
                    return (
                        <div key={prod.id} className="flex justify-between items-center p-3 border rounded-xl">
                            <div className="flex flex-col max-w-[150px]">
                                <span className="text-xs font-bold truncate">{prod.name}</span>
                                <span className="text-[10px] text-muted-foreground">{prod.categories?.[0]}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={minStock === 0 ? "destructive" : "secondary"} className="text-[10px] h-5">
                                    {minStock === 0 ? "Out" : `${minStock} Low`}
                                </Badge>
                                <Button variant="secondary" size="icon" className="h-8 w-8" asChild><Link href={`/admin/products/${prod.id}`}><Eye className="h-4 w-4" /></Link></Button>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t.pendingReviews}</CardTitle>
              <CardDescription>{t.reviewDesc}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/reviews`}>{t.viewAll}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeleton /> : pendingReviews.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noPendingReviews}</p> : (
              <div className="space-y-3">
                {pendingReviews.map(review => (
                  <div key={review.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold">{review.customer_name}</span>
                        <div className="flex items-center mt-0.5">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                            ))}
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild><Link href={`/admin/reviews`}>{t.view}</Link></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t.unansweredQna}</CardTitle>
              <CardDescription>{t.qnaDesc}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/qna`}>{t.viewAll}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <TableSkeleton /> : unansweredQuestions.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noUnansweredQna}</p> : (
              <div className="space-y-3">
                {unansweredQuestions.map(q => (
                  <div key={q.id} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col min-w-0 flex-1 pr-4">
                        <span className="text-xs font-bold">{q.customer_name}</span>
                        <p className="text-[10px] text-muted-foreground truncate italic">"{q.question}"</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild><Link href={`/admin/qna`}>{t.view}</Link></Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
