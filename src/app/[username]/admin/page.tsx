
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/stores/auth';
import type { Order, Product, FlashDeal, ProductReview, ProductQna } from '@/types';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Ban } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

// Modular Components
        import DashboardStats from '@/components/admin/dashboard-stats';
        import DashboardCharts from '@/components/admin/dashboard-charts';
        import DashboardTables from '@/components/admin/dashboard-tables';

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
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [pendingReviews, setPendingReviews] = useState<ProductReview[]>([]);
  const [unansweredQuestions, setPendingQuestions] = useState<ProductQna[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const lang = user?.language || 'bn';
  const t = translations[lang].dashboard;

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

        // Fetch using created secure APIs
        const [ordersRes, productsRes, uncompletedRes, customersRes, flashDealsRes, reviewsRes, qnaRes] = await Promise.all([
          fetch('/api/orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/products/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/uncompleted-orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/customers/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/flash-deals/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/reviews/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/qna/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
        ]);

        const [ordersResult, productsResult, uncompletedResult, customersResult, flashDealsResult, reviewsResult, qnaResult] = await Promise.all([
          ordersRes.json(), productsRes.json(), uncompletedRes.json(), customersRes.json(), flashDealsRes.json(), reviewsRes.json(), qnaRes.json()
        ]);

        const fetchedOrders = ordersResult.orders || [];
        const fetchedProducts = productsResult.products || [];
        const fetchedUncompleted = uncompletedResult.orders || [];
        const fetchedCustomers = customersResult.customers || [];
        const fetchedDeals = flashDealsResult.deals || [];
        const fetchedReviews = reviewsResult.reviews || [];
        const fetchedQna = qnaResult.qna || [];

        // Stats calculation
        const totalRevenue = fetchedOrders.filter((o: any) => o.status === 'delivered').reduce((acc: number, o: any) => acc + o.total, 0);
        const monthlyOrdersCount = fetchedOrders.filter((o: any) => new Date(o.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1) && o.status !== 'canceled').length;
        const unviewedCount = fetchedUncompleted.filter((o: any) => !o.is_viewed).length;
        const activeDealsCount = fetchedDeals.filter((d: any) => d.is_active && new Date(d.end_date) > new Date()).length;

        // Revenue Chart (Last 7 days)
        const dailyRevenue: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
          const dateStr = format(subDays(new Date(), i), 'MMM d');
          dailyRevenue[dateStr] = 0;
        }
        fetchedOrders.filter((o: any) => new Date(o.created_at) >= sevenDaysAgo && o.status === 'delivered').forEach((o: any) => {
          const dateStr = format(new Date(o.created_at), 'MMM d');
          if (dailyRevenue.hasOwnProperty(dateStr)) dailyRevenue[dateStr] += o.total;
        });

        setStats({
          totalRevenue,
          totalProducts: fetchedProducts.length,
          uncompletedOrders: unviewedCount,
          totalUncompletedOrders: fetchedUncompleted.length,
          totalCustomers: fetchedCustomers.length,
          ordersThisMonth: monthlyOrdersCount,
          activeFlashDeals: activeDealsCount,
        });

        setAllOrders(fetchedOrders);
        setRevenueChartData(Object.keys(dailyRevenue).map(date => ({ date, Revenue: dailyRevenue[date] })));
        setPendingOrders(fetchedOrders.filter((o: any) => o.status === 'pending').slice(0, 5));
        setLowStockProducts(fetchedProducts.filter((p: any) => p.stock !== null && p.stock < 10).slice(0, 5));
        setPendingReviews(fetchedReviews.filter((r: any) => !r.is_approved).slice(0, 5));
        setPendingQuestions(fetchedQna.filter((q: any) => !q.is_approved).slice(0, 5));

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Failed to load dashboard', description: error.message });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!authLoading) fetchData();
  }, [user, authLoading, toast]);

  const productLimit = user?.product_limit;
  const customerLimit = user?.customer_limit;
  const orderLimit = user?.order_limit;
  const isLimitReached = (productLimit !== null && stats.totalProducts >= productLimit) || 
                         (customerLimit !== null && stats.totalCustomers >= customerLimit) || 
                         (orderLimit !== null && stats.ordersThisMonth >= orderLimit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
      
      {isLimitReached && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>{t.limitReached}</AlertTitle>
          <AlertDescription>
            {t.limitDesc} <Link href="/admin/settings" className="font-semibold underline">{t.upgrade}</Link> {t.limitDesc2}
          </AlertDescription>
        </Alert>
      )}

      <DashboardStats 
        stats={stats} 
        limits={{ productLimit: user?.product_limit ?? null, customerLimit: user?.customer_limit ?? null, orderLimit: user?.order_limit ?? null }} 
        isLoading={isLoading} 
        t={t} 
      />

      <DashboardCharts 
        revenueChartData={revenueChartData} 
        allOrders={allOrders} 
        isLoading={isLoading} 
        t={t} 
      />

      <DashboardTables 
        pendingOrders={pendingOrders} 
        lowStockProducts={lowStockProducts} 
        pendingReviews={pendingReviews} 
        unansweredQuestions={unansweredQuestions} 
        isLoading={isLoading} 
        t={t} 
      />
    </div>
  );
}
