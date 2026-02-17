
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import type { Order, Product } from '@/types';
import Link from 'next/link';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
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
  Users,
  Ban,
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
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    uncompletedOrders: 0,
    totalUncompletedOrders: 0,
    totalCustomers: 0,
    ordersThisMonth: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New states for Order Status Chart
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);

  const lang = user?.language || 'bn';
  const t = {
    dashboard: { en: 'Dashboard', bn: 'ড্যাশবোর্ড' },
    limitReached: { en: 'Subscription Limit Reached', bn: 'সাবস্ক্রিপশন লিমিট শেষ' },
    limitDesc: { en: 'You have reached one or more limits of your current plan. Please', bn: 'আপনি আপনার বর্তমান প্ল্যানের এক বা একাধিক লিমিট শেষ করে ফেলেছেন। অনুগ্রহ করে' },
    upgrade: { en: 'upgrade your subscription', bn: 'আপনার সাবস্ক্রিপশন আপগ্রেড করুন' },
    limitDesc2: { en: 'to continue adding new products, or accepting new customers/orders.', bn: 'নতুন পণ্য যোগ করা, বা নতুন গ্রাহক/অর্ডার গ্রহণ করা চালিয়ে যেতে।' },
    totalRevenue: { en: 'Total Revenue', bn: 'মোট আয়' },
    allTime: { en: 'All-time delivered orders', bn: 'সর্বকালের ডেলিভারিকৃত অর্ডার' },
    newUncompleted: { en: 'New Uncompleted Orders', bn: 'নতুন অসম্পূর্ণ অর্ডার' },
    totalAbandoned: { en: 'total abandoned carts', bn: 'মোট পরিত্যক্ত কার্ট' },
    products: { en: 'Products', bn: 'পণ্য' },
    customers: { en: 'Customers', bn: 'গ্রাহক' },
    ordersThisMonth: { en: 'Orders (This Month)', bn: 'এই মাসের অর্ডার' },
    limitReachedAlert: { en: 'Limit reached. Upgrade plan to add more.', bn: 'লিমিট শেষ। আরও যোগ করতে প্ল্যান আপগ্রেড করুন।' },
    unlimited: { en: 'Unlimited on your current plan', bn: 'আপনার বর্তমান প্ল্যানে সীমাহীন' },
    remaining: { en: 'remaining', bn: 'বাকি আছে' },
    revenue7Days: { en: 'Revenue (Last 7 Days)', bn: 'রাজস্ব (শেষ ৭ দিন)' },
    salesByPayment: { en: 'Total Sales by Payment Method', bn: 'পেমেন্ট পদ্ধতি অনুসারে মোট বিক্রয়' },
    salesByPaymentDesc: { en: 'All-time sales distribution by payment method (excludes canceled orders).', bn: 'পেমেন্ট পদ্ধতি অনুসারে সর্বকালের বিক্রয় বণ্টন (বাতিল অর্ডার 제외)।' },
    noSales: { en: 'No sales data available.', bn: 'কোনো বিক্রয় ডেটা উপলব্ধ নেই।' },
    totalSales: { en: 'Total Sales', bn: 'মোট বিক্রয়' },
    orderStatus: { en: 'Order Status', bn: 'অর্ডারের অবস্থা' },
    orderStatusDesc: { en: 'Order distribution for the selected month.', bn: 'নির্বাচিত মাসের জন্য অর্ডার বণ্টন।' },
    selectMonth: { en: 'Select Month', bn: 'মাস নির্বাচন করুন' },
    noOrdersThisMonth: { en: 'No orders this month.', bn: 'এই মাসে কোনো অর্ডার নেই।' },
    totalOrders: { en: 'Total Orders', bn: 'মোট অর্ডার' },
    recentPending: { en: 'Recent Pending Orders', bn: 'সাম্প্রতিক পেন্ডিং অর্ডার' },
    reviewProcess: { en: 'Review and process new orders.', bn: 'নতুন অর্ডার পর্যালোচনা এবং প্রক্রিয়া করুন।' },
    viewAll: { en: 'View All', bn: 'সব দেখুন' },
    noPendingOrders: { en: 'No pending orders.', bn: 'কোনো পেন্ডিং অর্ডার নেই।' },
    details: { en: 'Details', bn: 'বিস্তারিত' },
    viewOrder: { en: 'View Order', bn: 'অর্ডার দেখুন' },
    lowStock: { en: 'Low Stock Products', bn: 'কম স্টক পণ্য' },
    lowStockDesc: { en: 'Products with fewer than 10 items left.', bn: '১০টিরও কম আইটেম বাকি থাকা পণ্য।' },
    sufficientStock: { en: 'All products have sufficient stock.', bn: 'সমস্ত পণ্যের পর্যাপ্ত স্টক আছে।' },
    stockLeft: { en: 'Stock Left', bn: 'স্টক বাকি' },
    action: { en: 'Action', bn: 'কার্যকলাপ' },
    edit: { en: 'Edit', bn: 'সম্পাদনা' },
    stock: { en: 'Stock', bn: 'স্টক' },
  };

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
    const siteId = user?.id;
    if (!siteId) {
        setIsLoading(false);
        return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        const startOfCurrentMonth = startOfMonth(new Date()).toISOString();


        // Fetch all orders once
        const ordersPromise = supabase.from('orders').select('total, status, created_at, payment_method, shipping_info, order_number, id').eq('site_id', siteId);
        const productsPromise = supabase.from('products').select('*', { count: 'exact' }).eq('site_id', siteId);
        const uncompletedPromise = supabase.from('uncompleted_orders').select('*', { count: 'exact' }).eq('site_id', siteId);
        const customersPromise = supabase.from('customer_profiles').select('*', { count: 'exact', head: true }).eq('site_id', siteId);

        const [
          { data: allOrders, error: ordersError },
          { data: productsData, count: totalProducts, error: productsError },
          { data: uncompletedData, count: totalUncompleted, error: uncompletedError },
          { count: totalCustomers, error: customersError },
        ] = await Promise.all([ordersPromise, productsPromise, uncompletedPromise, customersPromise]);
        
        if (ordersError) throw new Error(`Failed to fetch orders: ${ordersError.message}`);
        if (productsError) throw new Error(`Failed to fetch products: ${productsError.message}`);
        if (uncompletedError) throw new Error(`Failed to fetch uncompleted orders: ${uncompletedError.message}`);
        if (customersError) throw new Error(`Failed to fetch customers: ${customersError.message}`);

        if (allOrders) {
          // --- Revenue Chart Data (Last 7 days) ---
          const totalRevenue = allOrders
            .filter(o => o.status === 'delivered')
            .reduce((acc, o) => acc + o.total, 0);

          setPendingOrders(allOrders.filter(o => o.status === 'pending').slice(0, 5) as any);

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
          
          const monthlyOrdersCount = allOrders.filter(o => new Date(o.created_at) >= new Date(startOfCurrentMonth) && o.status !== 'canceled').length;

          setStats(prev => ({ ...prev, totalRevenue, ordersThisMonth: monthlyOrdersCount }));

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
          setStats(prev => ({ ...prev, totalProducts: totalProducts || 0 }));
          setLowStockProducts(productsData.filter(p => p.stock !== undefined && p.stock !== null && p.stock < 10).slice(0, 5));
        }
        
        if (uncompletedData) {
          const unviewedCount = uncompletedData.filter((o: any) => !o.is_viewed).length;
          setStats(prev => ({...prev, uncompletedOrders: unviewedCount, totalUncompletedOrders: totalUncompleted || 0}));
        } else {
          setStats(prev => ({...prev, uncompletedOrders: 0, totalUncompletedOrders: 0}));
        }

        setStats(prev => ({ ...prev, totalCustomers: totalCustomers || 0 }));
      } catch (error: any) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
            variant: 'destructive',
            title: 'Failed to load dashboard',
            description: error.message
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user?.id, selectedMonth, toast]);

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

  const productLimit = user?.product_limit;
  const isProductLimitReached = productLimit !== null && stats.totalProducts >= productLimit;
  
  const customerLimit = user?.customer_limit;
  const isCustomerLimitReached = customerLimit !== null && stats.totalCustomers >= customerLimit;

  const orderLimit = user?.order_limit;
  const isOrderLimitReached = orderLimit !== null && stats.ordersThisMonth >= orderLimit;


  const LimitStatCard = ({ title, value, limit, icon: Icon, isLimitReached, isLoading }: { title: string, value: number, limit: number | null, icon: React.ElementType, isLimitReached: boolean, isLoading?: boolean }) => {
    const isUnlimited = limit === null;
    const percentage = !isUnlimited && limit > 0 ? Math.min(100, (value / limit) * 100) : 0;

    return (
        <Card className={isLimitReached ? 'border-destructive' : ''}>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className={isLimitReached ? 'text-destructive' : ''}>{title}</span>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <>
                        <Skeleton className="h-7 w-24 mb-2" />
                        <Skeleton className="h-4 w-full" />
                    </>
                ) : (
                    <>
                        <div className="text-2xl font-bold">
                            {value}
                            {!isUnlimited && <span className="text-lg text-muted-foreground"> / {limit}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isLimitReached ? t.limitReachedAlert[lang] : isUnlimited ? t.unlimited[lang] : `${Math.max(0, limit - value)} ${t.remaining[lang]}`}
                        </p>
                        {!isUnlimited && <Progress value={percentage} className="mt-2 h-2" />}
                    </>
                )}
            </CardContent>
        </Card>
    );
};
  
  const monthOptions = [...Array(6)].map((_, i) => subMonths(new Date(), i));
  const totalOrdersForMonth = orderStatusData.reduce((sum, item) => sum + item.value, 0);
  const totalSales = paymentMethodData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.dashboard[lang]}</h1>
      { (isProductLimitReached || isCustomerLimitReached || isOrderLimitReached) && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>{t.limitReached[lang]}</AlertTitle>
          <AlertDescription>
            {t.limitDesc[lang]}{' '}
            <Link href="/admin/settings" className="font-semibold underline">
                {t.upgrade[lang]}
            </Link>
            {' '}{t.limitDesc2[lang]}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t.totalRevenue[lang]} value={`BDT ${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} isLoading={isLoading} description={t.allTime[lang]} />
        <StatCard title={t.newUncompleted[lang]} value={stats.uncompletedOrders} icon={FileClock} isLoading={isLoading} description={`${stats.totalUncompletedOrders} ${t.totalAbandoned[lang]}`} />
        <LimitStatCard title={t.products[lang]} value={stats.totalProducts} limit={user?.product_limit ?? null} icon={Package} isLoading={isLoading} isLimitReached={isProductLimitReached} />
        <LimitStatCard title={t.customers[lang]} value={stats.totalCustomers} limit={user?.customer_limit ?? null} icon={Users} isLoading={isLoading} isLimitReached={isCustomerLimitReached}/>
        <LimitStatCard title={t.ordersThisMonth[lang]} value={stats.ordersThisMonth} limit={user?.order_limit ?? null} icon={ShoppingBag} isLoading={isLoading} isLimitReached={isOrderLimitReached}/>
      </div>
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" /> {t.revenue7Days[lang]}</CardTitle>
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
                <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> {t.salesByPayment[lang]}</CardTitle>
                <CardDescription>{t.salesByPaymentDesc[lang]}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : paymentMethodData.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    {t.noSales[lang]}
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
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{paddingTop: 20}}
                        />
                       {totalSales > 0 && (
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-foreground text-2xl font-bold"
                            >
                                {`৳${(totalSales / 1000).toFixed(0)}k`}
                            </text>
                        )}
                        {totalSales > 0 && (
                            <text
                                x="50%"
                                y="50%"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                dy="20"
                                className="fill-muted-foreground text-sm"
                            >
                                {t.totalSales[lang]}
                            </text>
                        )}
                    </PieChart>
                </ResponsiveContainer>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> {t.orderStatus[lang]}</CardTitle>
                    <CardDescription>{t.orderStatusDesc[lang]}</CardDescription>
                </div>
                <Select onValueChange={(value) => setSelectedMonth(new Date(value))} defaultValue={format(selectedMonth, 'yyyy-MM-dd')}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t.selectMonth[lang]} />
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
                        {t.noOrdersThisMonth[lang]}
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
                          layout="horizontal"
                          verticalAlign="bottom"
                          align="center"
                           wrapperStyle={{paddingTop: 20}}
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
                            {t.totalOrders[lang]}
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
                    <CardTitle>{t.recentPending[lang]}</CardTitle>
                    <CardDescription>{t.reviewProcess[lang]}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/orders`}>{t.viewAll[lang]} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-40 w-full" /> : pendingOrders.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.noPendingOrders[lang]}</p> : (
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
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4"/>{t.details[lang]}</Link></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="grid gap-4 md:hidden">
                        {pendingOrders.map(order => (
                            <Card key={order.id}>
                                <CardHeader><CardTitle className="text-sm">{order.order_number}</CardTitle><CardDescription>{(order as any).shipping_info?.name || 'N/A'}</CardDescription></CardHeader>
                                <CardContent className="flex justify-between items-center"><p className="font-bold">BDT {order.total.toFixed(2)}</p><Button variant="secondary" size="sm" asChild><Link href={`/admin/orders/${order.id}`}>{t.viewOrder[lang]}</Link></Button></CardContent>
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
                    <CardTitle>{t.lowStock[lang]}</CardTitle>
                    <CardDescription>{t.lowStockDesc[lang]}</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/products`}>{t.viewAll[lang]} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardHeader>
            <CardContent>
                 {isLoading ? <Skeleton className="h-40 w-full" /> : lowStockProducts.length === 0 ? <p className="text-muted-foreground text-center py-8">{t.sufficientStock[lang]}</p> : (
                  <>
                     <div className="hidden md:block">
                      <Table>
                        <TableHeader><TableRow><TableHead>{t.products[lang]}</TableHead><TableHead>{t.stockLeft[lang]}</TableHead><TableHead className="text-right">{t.action[lang]}</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {lowStockProducts.map(product => (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell><Badge variant="destructive">{product.stock}</Badge></TableCell>
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/products/${product.id}`}><Eye className="mr-2 h-4 w-4"/>{t.edit[lang]}</Link></Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                     <div className="grid gap-4 md:hidden">
                        {lowStockProducts.map(product => (
                            <Card key={product.id}>
                                <CardHeader><CardTitle className="text-sm">{product.name}</CardTitle></CardHeader>
                                <CardContent className="flex justify-between items-center"><Badge variant="destructive">{t.stock[lang]}: {product.stock}</Badge><Button variant="secondary" size="sm" asChild><Link href={`/admin/products/${product.id}`}>{t.edit[lang]}</Link></Button></CardContent>
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
