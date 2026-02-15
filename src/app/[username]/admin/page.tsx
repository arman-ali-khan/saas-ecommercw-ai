
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import type { Order, Product } from '@/types';
import Link from 'next/link';
import { format, subDays, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  PieChart as PieChartIcon,
  Wallet,
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
  PieChart,
  Pie,
  Cell,
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
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New states for Order Status Chart
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);

  const ORDER_STATUSES = {
      pending: { label: 'Pending', color: 'hsl(var(--chart-1))' },
      approved: { label: 'Approved', color: 'hsl(var(--chart-2))' },
      processing: { label: 'Processing', color: 'hsl(var(--chart-3))' },
      packaging: { label: 'Packaging', color: 'hsl(var(--chart-4))' },
      'send for delivery': { label: 'Out for Delivery', color: 'hsl(var(--chart-5))' },
      delivered: { label: 'Delivered', color: 'hsl(var(--primary))' },
      canceled: { label: 'Canceled', color: 'hsl(var(--destructive))' },
  };

  const PAYMENT_METHOD_TYPES = {
    cod: { label: 'Cash on Delivery', color: 'hsl(var(--chart-1))' },
    mobile_banking: { label: 'Direct Payment', color: 'hsl(var(--chart-2))' },
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);

      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      // Fetch all orders once
      const { data: allOrders, error: ordersError } = await supabase.from('orders').select('*').eq('site_id', user.id);
      
      const productsPromise = supabase.from('products').select('*').eq('site_id', user.id);
      const uncompletedPromise = supabase.from('uncompleted_orders').select('*', { count: 'exact' }).eq('site_id', user.id);

      const [
        { data: productsData, error: productsError },
        { data: uncompletedData, count: totalUncompleted, error: uncompletedError },
      ] = await Promise.all([productsPromise, uncompletedPromise]);

      if (allOrders) {
        // --- Revenue Chart Data (Last 7 days) ---
        const totalRevenue = allOrders
          .filter(o => o.status === 'delivered')
          .reduce((acc, o) => acc + o.total, 0);

        const totalOrders = allOrders.filter(o => o.status !== 'canceled').length;
        setPendingOrders(allOrders.filter(o => o.status === 'pending').slice(0, 5));

        const dailyRevenue: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'MMM d');
            dailyRevenue[formattedDate] = 0;
        }

        allOrders
          .filter(o => new Date(o.created_at) >= new Date(sevenDaysAgo) && o.status === 'delivered')
          .forEach(o => {
            const date = format(new Date(o.created_at), 'MMM d');
            if (dailyRevenue.hasOwnProperty(date)) {
               dailyRevenue[date] += o.total;
            }
          });
        
        const revenueChartFormattedData = Object.keys(dailyRevenue)
            .map(date => ({ date, Revenue: dailyRevenue[date] }));
            
        setRevenueChartData(revenueChartFormattedData);
        setStats(prev => ({ ...prev, totalRevenue, totalOrders }));

        // --- Order Status Chart Data (for selected month) ---
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        
        const ordersForMonth = allOrders.filter(o => isWithinInterval(new Date(o.created_at), {start, end}));
        
        const statusCounts = ordersForMonth.reduce((acc, order) => {
            const status = order.status.toLowerCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(statusCounts)
          .map(([status, count]) => ({
              name: ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label || status,
              value: count,
              fill: ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.color || '#8884d8',
          }))
          .filter(item => item.name !== 'Canceled');
          
        setOrderStatusData(chartData);

        // --- Payment Method Chart Data (All Time) ---
        const paymentMethodSales = allOrders
          .filter(o => o.status !== 'canceled')
          .reduce((acc, order) => {
            const method = order.payment_method; // 'cod' or 'mobile_banking'
            acc[method] = (acc[method] || 0) + order.total;
            return acc;
          }, {} as Record<string, number>);
        
        const paymentChartData = Object.entries(paymentMethodSales)
          .map(([method, total]) => ({
            name: PAYMENT_METHOD_TYPES[method as keyof typeof PAYMENT_METHOD_TYPES]?.label || method,
            value: total,
            fill: PAYMENT_METHOD_TYPES[method as keyof typeof PAYMENT_METHOD_TYPES]?.color || '#8884d8',
          }));
        
        setPaymentMethodData(paymentChartData);
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
  }, [user, selectedMonth]);

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
  );
  
  const monthOptions = [...Array(6)].map((_, i) => subMonths(new Date(), i));
  const totalOrdersForMonth = orderStatusData.reduce((sum, item) => sum + item.value, 0);
  const totalSales = paymentMethodData.reduce((sum, item) => sum + item.value, 0);

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
                  <RechartsLineChart data={revenueChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> Total Sales by Payment Method</CardTitle>
                <CardDescription>All-time sales distribution by payment method (excludes canceled orders).</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : paymentMethodData.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    No sales data available.
                </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                            formatter={(value: number) => `BDT ${value.toFixed(2)}`}
                        />
                        <Pie
                            data={paymentMethodData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={5}
                            strokeWidth={0}
                        >
                            {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Legend
                            iconSize={10}
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                        />
                        {totalSales > 0 && (
                            <text
                                
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-foreground text-2xl font-bold"
                            >
                                {`৳${(totalSales / 1000).toFixed(0)}k`}
                            </text>
                        )}
                        {totalSales > 0 && (
                            <text
                                
                                textAnchor="middle"
                                dominantBaseline="middle"
                                dy="20"
                                className="fill-muted-foreground text-sm"
                            >
                                Total Sales
                            </text>
                        )}
                    </PieChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> Order Status</CardTitle>
                    <CardDescription>Order distribution for the selected month.</CardDescription>
                </div>
                <Select onValueChange={(value) => setSelectedMonth(new Date(value))} defaultValue={format(selectedMonth, 'yyyy-MM-dd')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {monthOptions.map(month => (
                            <SelectItem key={month.toISOString()} value={month.toISOString()}>
                                {format(month, 'MMMM yyyy')}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : orderStatusData.length === 0 ? (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        No orders this month.
                    </div>
                ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))' }}
                        />
                        <Pie
                            data={orderStatusData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="60%"
                            outerRadius="80%"
                            paddingAngle={5}
                            strokeWidth={0}
                        >
                            {orderStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Legend
                          iconSize={10}
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                        />
                        {totalOrdersForMonth > 0 && (
                          <text
                            x="50%"
                            y="50%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-foreground text-2xl font-bold"
                          >
                            {totalOrdersForMonth}
                          </text>
                        )}
                         {totalOrdersForMonth > 0 && (
                          <text
                             x="50%"
                             y="50%"
                             textAnchor="middle"
                             dominantBaseline="middle"
                             dy="20"
                             className="fill-muted-foreground text-sm"
                           >
                            Total Orders
                          </text>
                         )}
                    </PieChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
       </div>

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
