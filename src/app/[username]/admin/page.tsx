
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import type { Order, Product, FlashDeal, ProductReview, ProductQna } from '@/types';
import Link from 'next/link';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Flame,
  Star,
  HelpCircle,
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
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

const translations = { en, bn };


export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalProducts: 0,
    uncompletedOrders: 0,
    totalUncompletedOrders: 0,
    totalCustomers: 0,
    ordersThisMonth: 0,
    activeFlashDeals: 0,
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [pendingReviews, setPendingReviews] = useState<ProductReview[]>([]);
  const [unansweredQuestions, setPendingQuestions] = useState<ProductQna[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for Order Status Chart
  const [orderStatusData, setOrderStatusData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [paymentMethodData, setPaymentMethodData] = useState<any[]>([]);

  const lang = user?.language || 'bn';
  const t = translations[lang].dashboard;

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
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const siteId = user.id;
        const sevenDaysAgo = subDays(new Date(), 7);
        const startOfCurrentMonth = startOfMonth(new Date());

        // Fetch using created secure APIs
        const [ordersRes, productsRes, uncompletedRes, customersRes, flashDealsRes, reviewsRes, qnaRes] = await Promise.all([
            fetch('/api/orders/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            }),
            fetch('/api/products/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            }),
            fetch('/api/uncompleted-orders/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            }),
            fetch('/api/customers/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            }),
            fetch('/api/flash-deals/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            }),
            fetch('/api/reviews/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            }),
            fetch('/api/qna/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ siteId }),
            }),
        ]);

        const [ordersResult, productsResult, uncompletedResult, customersResult, flashDealsResult, reviewsResult, qnaResult] = await Promise.all([
            ordersRes.json(),
            productsRes.json(),
            uncompletedRes.json(),
            customersRes.json(),
            flashDealsResult = await flashDealsRes.json(),
            reviewsRes.json(),
            qnaRes.json(),
        ]);

        if (!ordersRes.ok) throw new Error(ordersResult.error || 'Failed to fetch orders');
        if (!productsRes.ok) throw new Error(productsResult.error || 'Failed to fetch products');
        if (!uncompletedRes.ok) throw new Error(uncompletedResult.error || 'Failed to fetch uncompleted orders');
        if (!customersRes.ok) throw new Error(customersResult.error || 'Failed to fetch customers');
        if (!flashDealsRes.ok) throw new Error(flashDealsResult.error || 'Failed to fetch flash deals');
        if (!reviewsRes.ok) throw new Error(reviewsResult.error || 'Failed to fetch reviews');
        if (!qnaRes.ok) throw new Error(qnaResult.error || 'Failed to fetch Q&A');

        const allOrders: any[] = ordersResult.orders || [];
        const allProducts: any[] = productsResult.products || [];
        const uncompletedData: any[] = uncompletedResult.orders || [];
        const customersData: any[] = customersResult.customers || [];
        const allDeals: FlashDeal[] = flashDealsResult.deals || [];
        const allReviews: ProductReview[] = reviewsResult.reviews || [];
        const allQna: ProductQna[] = qnaResult.qna || [];

        // --- Calculate Stats ---
        const totalRevenue = allOrders
            .filter(o => o.status === 'delivered')
            .reduce((acc, o) => acc + o.total, 0);

        setPendingOrders(allOrders.filter(o => o.status === 'pending').slice(0, 5));
        setPendingReviews(allReviews.filter(r => !r.is_approved).slice(0, 5));
        setPendingQuestions(allQna.filter(q => !q.is_approved).slice(0, 5));

        // Revenue Chart (Last 7 days)
        const dailyRevenue: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const formattedDate = format(date, 'MMM d');
            dailyRevenue[formattedDate] = 0;
        }

        allOrders
            .filter(o => new Date(o.created_at) >= sevenDaysAgo && o.status === 'delivered')
            .forEach(o => {
                const date = format(new Date(o.created_at), 'MMM d');
                if (dailyRevenue.hasOwnProperty(date)) {
                    dailyRevenue[date] += o.total;
                }
            });
        
        setRevenueChartData(Object.keys(dailyRevenue).map(date => ({ date, Revenue: dailyRevenue[date] })));

        const monthlyOrdersCount = allOrders.filter(o => new Date(o.created_at) >= startOfCurrentMonth && o.status !== 'canceled').length;

        // Order Status Chart (for selected month)
        const start = startOfMonth(selectedMonth);
        const end = endOfMonth(selectedMonth);
        const ordersForMonth = allOrders.filter(o => isWithinInterval(new Date(o.created_at), {start, end}));
        
        const statusCounts = ordersForMonth.reduce((acc, order) => {
            const status = order.status.toLowerCase();
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        setOrderStatusData(Object.entries(statusCounts)
            .map(([status, count]) => ({
                name: ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.label || status,
                value: count,
                fill: ORDER_STATUSES[status as keyof typeof ORDER_STATUSES]?.color || '#8884d8',
            }))
            .filter(item => item.name !== 'Canceled')
        );

        // Payment Method Chart (All Time)
        const paymentMethodSales = allOrders
            .filter(o => o.status !== 'canceled')
            .reduce((acc, order) => {
                const method = order.payment_method;
                acc[method] = (acc[method] || 0) + order.total;
                return acc;
            }, {} as Record<string, number>);
        
        setPaymentMethodData(Object.entries(paymentMethodSales)
            .map(([method, total]) => ({
                name: PAYMENT_METHOD_TYPES[method as keyof typeof PAYMENT_METHOD_TYPES]?.label || method,
                value: total,
                fill: PAYMENT_METHOD_TYPES[method as keyof typeof PAYMENT_METHOD_TYPES]?.color || '#8884d8',
            }))
        );

        // Products and Customers
        setLowStockProducts(allProducts.filter(p => p.stock !== undefined && p.stock !== null && p.stock < 10).slice(0, 5));
        
        const unviewedCount = uncompletedData.filter((o: any) => !o.is_viewed).length;
        const now = new Date();
        const activeDealsCount = allDeals.filter(d => d.is_active && new Date(d.end_date) > now).length;

        setStats({
            totalRevenue,
            totalProducts: allProducts.length,
            uncompletedOrders: unviewedCount,
            totalUncompletedOrders: uncompletedData.length,
            totalCustomers: customersData.length,
            ordersThisMonth: monthlyOrdersCount,
            activeFlashDeals: activeDealsCount,
        });

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
    
    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading, selectedMonth, toast]);

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
                            {isLimitReached ? t.limitReachedAlert : isUnlimited ? t.unlimited : `${Math.max(0, limit - value)} ${t.remaining}`}
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
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
      { (isProductLimitReached || isCustomerLimitReached || isOrderLimitReached) && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>{t.limitReached}</AlertTitle>
          <AlertDescription>
            {t.limitDesc}{' '}
            <Link href="/admin/settings" className="font-semibold underline">
                {t.upgrade}
            </Link>
            {' '}{t.limitDesc2}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title={t.totalRevenue} value={`BDT ${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} isLoading={isLoading} description={t.allTime} />
        <StatCard title={t.newUncompleted} value={stats.uncompletedOrders} icon={FileClock} isLoading={isLoading} description={`${stats.totalUncompletedOrders} ${t.totalAbandoned}`} />
        <StatCard title={t.activeFlashDeals} value={stats.activeFlashDeals} icon={Flame} isLoading={isLoading} />
        <LimitStatCard title={t.products} value={stats.totalProducts} limit={user?.product_limit ?? null} icon={Package} isLoading={isLoading} isLimitReached={isProductLimitReached} />
        <LimitStatCard title={t.customers} value={stats.totalCustomers} limit={user?.customer_limit ?? null} icon={Users} isLoading={isLoading} isLimitReached={isCustomerLimitReached}/>
        <LimitStatCard title={t.ordersThisMonth} value={stats.ordersThisMonth} limit={user?.order_limit ?? null} icon={ShoppingBag} isLoading={isLoading} isLimitReached={isOrderLimitReached}/>
      </div>
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" /> {t.revenue7Days}</CardTitle>
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
                <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> {t.salesByPayment}</CardTitle>
                <CardDescription>{t.salesByPaymentDesc}</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : paymentMethodData.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    {t.noSales}
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
                                {t.totalSales}
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
                    <CardTitle className="flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> {t.orderStatus}</CardTitle>
                    <CardDescription>{t.orderStatusDesc}</CardDescription>
                </div>
                <Select onValueChange={(value) => setSelectedMonth(new Date(value))} defaultValue={format(selectedMonth, 'yyyy-MM-dd')}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder={t.selectMonth} />
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
                        {t.noOrdersThisMonth}
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
                            {t.totalOrders}
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
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/orders/${order.id}`}><Eye className="mr-2 h-4 w-4"/>{t.details}</Link></Button></TableCell>
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
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/products/${product.id}`}><Eye className="mr-2 h-4 w-4"/>{t.edit}</Link></Button></TableCell>
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
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/reviews`}><Eye className="mr-2 h-4 w-4"/>{t.view}</Link></Button></TableCell>
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
                              <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/admin/qna`}><Eye className="mr-2 h-4 w-4"/>{t.view}</Link></Button></TableCell>
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
                                    <Button variant="secondary" size="sm" asChild><Link href={`/admin/qna`}>{t.view}</Link></Button>
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
