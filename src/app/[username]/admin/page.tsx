
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import type { Order, Product } from '@/types';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  ShoppingBag,
  Package,
  FileClock,
  ArrowRight,
  Eye,
  LineChart,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    uncompletedOrders: 0,
    totalUncompletedOrders: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      // All promises
      const ordersPromise = supabase.from('orders').select('*').eq('site_id', user.id);
      const productsPromise = supabase.from('products').select('*').eq('site_id', user.id);
      const uncompletedPromise = supabase.from('uncompleted_orders').select('*', { count: 'exact' }).eq('site_id', user.id);

      const [
        { data: ordersData, error: ordersError },
        { data: productsData, error: productsError },
        { data: uncompletedData, count: totalUncompleted, error: uncompletedError },
      ] = await Promise.all([ordersPromise, productsPromise, uncompletedPromise]);

      if (ordersData) {
        const totalRevenue = ordersData
          .filter(o => o.status === 'delivered')
          .reduce((acc, o) => acc + o.total, 0);

        const totalOrders = ordersData.filter(o => o.status !== 'canceled').length;

        setPendingOrders(ordersData.filter(o => o.status === 'pending').slice(0, 5));

        const dailyRevenue: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'MMM d');
            dailyRevenue[formattedDate] = 0;
        }

        ordersData
          .filter(o => new Date(o.created_at) >= new Date(sevenDaysAgo) && o.status === 'delivered')
          .forEach(o => {
            const date = format(new Date(o.created_at), 'MMM d');
            if (dailyRevenue.hasOwnProperty(date)) {
               dailyRevenue[date] += o.total;
            }
          });
        
        const chartFormattedData = Object.keys(dailyRevenue)
            .map(date => ({ date, Revenue: dailyRevenue[date] }));
            
        setChartData(chartFormattedData);
        setStats(prev => ({ ...prev, totalRevenue, totalOrders }));
      }

      if (productsData) {
        setStats(prev => ({ ...prev, totalProducts: productsData.length }));
        setLowStockProducts(productsData.filter(p => p.stock !== undefined && p.stock !== null && p.stock < 10).slice(0, 5));
      }
      
      if (uncompletedData) {
        const unviewedCount = uncompletedData.filter((o: any) => !o.is_viewed).length;
        setStats(prev => ({...prev, uncompletedOrders: unviewedCount, totalUncompletedOrders: totalUncompleted || 0}));
      } else {
        setStats(prev => ({...prev, uncompletedOrders: 0, totalUncompletedOrders: 0}));
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [user]);
  
  const StatCard = ({ title, value, icon: Icon, isLoading, description }: { title: string, value: string | number, icon: React.ElementType, isLoading: boolean, description?: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {isLoading ? <Skeleton className="h-8 w-3/4" /> : <div className="text-2xl font-bold">{value}</div>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`BDT ${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} isLoading={isLoading} description="All-time delivered orders" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon={ShoppingBag} isLoading={isLoading} description="Excludes canceled orders" />
        <StatCard title="Total Products" value={stats.totalProducts} icon={Package} isLoading={isLoading} />
        <StatCard title="New Uncompleted Orders" value={stats.uncompletedOrders} icon={FileClock} isLoading={isLoading} description={`${stats.totalUncompletedOrders} total abandoned carts`} />
      </div>

       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" /> Revenue (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </RechartsLineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
       </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Recent Pending Orders</CardTitle>
                    <CardDescription>Review and process new orders.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/orders`}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-40 w-full" /> : pendingOrders.length === 0 ? <p className="text-muted-foreground text-center py-8">No pending orders.</p> : (
                  <>
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader><TableRow><TableHead>Order #</TableHead><TableHead>Customer</TableHead><TableHead>Total</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {pendingOrders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                              <TableCell>{order.shipping_info.name}</TableCell>
                              <TableCell>BDT {order.total.toFixed(2)}</TableCell>
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4"/>Details</Link></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid gap-4 md:hidden">
                        {pendingOrders.map(order => (
                            <Card key={order.id}>
                                <CardHeader><CardTitle className="text-sm">{order.order_number}</CardTitle><CardDescription>{order.shipping_info.name}</CardDescription></CardHeader>
                                <CardContent className="flex justify-between items-center"><p className="font-bold">BDT {order.total.toFixed(2)}</p><Button variant="secondary" size="sm" asChild><Link href={`/admin/orders/${order.id}`}>View Order</Link></Button></CardContent>
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
                    <CardTitle>Low Stock Products</CardTitle>
                    <CardDescription>Products with fewer than 10 items left.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/products`}>View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? <Skeleton className="h-40 w-full" /> : lowStockProducts.length === 0 ? <p className="text-muted-foreground text-center py-8">All products have sufficient stock.</p> : (
                  <>
                     <div className="hidden md:block">
                      <Table>
                        <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Stock Left</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {lowStockProducts.map(product => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell><Badge variant="destructive">{product.stock}</Badge></TableCell>
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/products/${product.id}`}><Eye className="mr-2 h-4 w-4"/>Edit</Link></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                     <div className="grid gap-4 md:hidden">
                        {lowStockProducts.map(product => (
                            <Card key={product.id}>
                                <CardHeader><CardTitle className="text-sm">{product.name}</CardTitle></CardHeader>
                                <CardContent className="flex justify-between items-center"><Badge variant="destructive">Stock: {product.stock}</Badge><Button variant="secondary" size="sm" asChild><Link href={`/admin/products/${product.id}`}>Edit</Link></Button></CardContent>
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
