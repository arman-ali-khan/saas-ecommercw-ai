
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowRight, Eye, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Order, Product, ProductReview, ProductQna } from '@/types';

interface DashboardTablesProps {
  pendingOrders: Order[];
  lowStockProducts: Product[];
  pendingReviews: ProductReview[];
  unansweredQuestions: ProductQna[];
  isLoading: boolean;
  t: any;
}

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
            {isLoading ? <Skeleton className="h-40 w-full" /> : pendingOrders.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noPendingOrders}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {pendingOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                          <TableCell>{(order as any).shipping_info?.name || 'N/A'}</TableCell>
                          <TableCell>BDT {order.total.toFixed(2)}</TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4" />{t.details}</Link></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {pendingOrders.map(order => (
                    <Card key={order.id}>
                      <CardHeader><CardTitle className="text-sm">{order.order_number}</CardTitle><CardDescription>{(order as any).shipping_info?.name || 'N/A'}</CardDescription></CardHeader>
                      <CardContent className="flex justify-between items-center"><p className="font-bold">BDT {order.total.toFixed(2)}</p><Button variant="secondary" size="sm" asChild><Link href={`/admin/orders/${order.id}`}>{t.viewOrder}</Link></Button></CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t.lowStock}</CardTitle>
              <CardDescription>{t.lowStockDesc}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/products`}>{t.viewAll} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : lowStockProducts.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.sufficientStock}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>{t.products}</TableHead><TableHead>{t.stockLeft}</TableHead><TableHead className="text-right">{t.action}</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {lowStockProducts.map(product => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell><Badge variant="destructive">{product.stock}</Badge></TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/products/${product.id}`}><Eye className="mr-2 h-4 w-4" />{t.edit}</Link></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {lowStockProducts.map(product => (
                    <Card key={product.id}>
                      <CardHeader><CardTitle className="text-sm">{product.name}</CardTitle></CardHeader>
                      <CardContent className="flex justify-between items-center"><Badge variant="destructive">{t.stock}: {product.stock}</Badge><Button variant="secondary" size="sm" asChild><Link href={`/admin/products/${product.id}`}>{t.edit}</Link></Button></CardContent>
                    </Card>
                  ))}
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
              <Link href={`/admin/reviews`}>{t.viewAll} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : pendingReviews.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noPendingReviews}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Rating</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {pendingReviews.map(review => (
                        <TableRow key={review.id}>
                          <TableCell className="font-medium">{review.customer_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/reviews`}><Eye className="mr-2 h-4 w-4" />{t.view}</Link></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {pendingReviews.map(review => (
                    <Card key={review.id}>
                      <CardHeader className="p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-sm">{review.customer_name}</CardTitle>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                          ))}
                        </div>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 justify-end">
                        <Button variant="secondary" size="sm" asChild><Link href={`/admin/reviews`}>{t.view}</Link></Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
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
              <Link href={`/admin/qna`}>{t.viewAll} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40 w-full" /> : unansweredQuestions.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noUnansweredQna}</p> : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Question</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {unansweredQuestions.map(q => (
                        <TableRow key={q.id}>
                          <TableCell className="font-medium text-xs">{q.customer_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs">"{q.question}"</TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/qna`}><Eye className="mr-2 h-4 w-4" />{t.view}</Link></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="grid gap-4 md:hidden">
                  {unansweredQuestions.map(q => (
                    <Card key={q.id}>
                      <CardHeader className="p-4 pb-2"><CardTitle className="text-sm">{q.customer_name}</CardTitle></CardHeader>
                      <CardContent className="p-4 pt-0">
                        <p className="text-xs text-muted-foreground truncate">"{q.question}"</p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 justify-end">
                        <Button variant="secondary" size="sm" asChild><Link href={`/admin/qna`}>{t.view} View</Link></Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
