
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import Link from 'next/link';
import { subDays, format as safeFormat } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Ban, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

// Modular Components
import DashboardStats from '@/components/admin/dashboard-stats';
import DashboardCharts from '@/components/admin/dashboard-charts';
import DashboardTables from '@/components/admin/dashboard-tables';

const LOW_STOCK_LIMIT = 10;

export default function AdminDashboard() {
  const { user } = useAuth();
  const { dashboard, setDashboard } = useAdminStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(() => {
    return !useAdminStore.getState().dashboard;
  });

  const fetchDashboardStats = useCallback(async (force = false) => {
    const activeSiteId = user?.id;
    if (!activeSiteId) return;

    const currentStore = useAdminStore.getState();
    const isFresh = Date.now() - currentStore.lastFetched.dashboard < 300000;
    
    if (!force && currentStore.dashboard && isFresh) {
        setIsLoading(false);
        return;
    }

    if (!currentStore.dashboard) {
        setIsLoading(true);
    }

    try {
        const sevenDaysAgo = subDays(new Date(), 7);

        const [ordersRes, productsRes, uncompletedRes, customersRes, flashDealsRes, reviewsRes, qnaRes] = await Promise.all([
          fetch('/api/orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteId }) }),
          fetch('/api/products/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteId }) }),
          fetch('/api/uncompleted-orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteId }) }),
          fetch('/api/customers/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteId }) }),
          fetch('/api/flash-deals/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteId }) }),
          fetch('/api/reviews/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteId }) }),
          fetch('/api/qna/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteId }) }),
        ]);

        const [ordersResult, productsResult, uncompletedResult, customersResult, flashDealsResult, reviewsResult, qnaResult] = await Promise.all([
          ordersRes.json(), 
          productsRes.json(), 
          uncompletedRes.json(), 
          customersRes.json(), 
          flashDealsResult.json(), 
          reviewsResult.json(), 
          qnaResult.json()
        ]);

        const fetchedOrders = ordersResult.orders || [];
        const fetchedProductsList = productsResult.products || [];
        const fetchedUncompleted = uncompletedResult.orders || [];
        const fetchedDeals = flashDealsResult.deals || [];
        const fetchedReviews = reviewsResult.reviews || [];
        const fetchedQnaList = qnaResult.qna || [];

        const totalRevenue = fetchedOrders.filter((o: any) => o.status === 'delivered').reduce((acc: number, o: any) => acc + o.total, 0);
        const monthlyOrdersCount = fetchedOrders.filter((o: any) => new Date(o.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1) && o.status !== 'canceled').length;
        const unviewedCount = fetchedUncompleted.filter((o: any) => !o.is_viewed).length;
        const activeDealsCount = fetchedDeals.filter((d: any) => d.is_active && new Date(d.end_date) > new Date()).length;

        // Daily Revenue Calculation
        const dailyRevenue: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const dateStr = safeFormat(d, 'MMM d');
          dailyRevenue[dateStr] = 0;
        }
        
        fetchedOrders.filter((o: any) => new Date(o.created_at) >= sevenDaysAgo && o.status === 'delivered').forEach((o: any) => {
          const dateStr = safeFormat(new Date(o.created_at), 'MMM d');
          if (Object.prototype.hasOwnProperty.call(dailyRevenue, dateStr)) {
            dailyRevenue[dateStr] += o.total;
          }
        });

        // Low Stock Detection
        const lowStockProductsList = fetchedProductsList.filter((prod: any) => {
            const hasLowStockVariant = prod.variants?.some((v: any) => (v.stock ?? 0) < LOW_STOCK_LIMIT);
            const hasLowBaseStock = (prod.stock ?? 0) < LOW_STOCK_LIMIT;
            return hasLowBaseStock || hasLowStockVariant;
        }).sort((a: any, b: any) => {
            const aMin = Math.min(a.stock ?? 0, ...(a.variants?.map((v: any) => v.stock ?? 0) || []));
            const bMin = Math.min(b.stock ?? 0, ...(b.variants?.map((v: any) => v.stock ?? 0) || []));
            return aMin - bMin;
        }).slice(0, 5);

        const newDashboardData = {
          totalRevenue,
          totalProducts: fetchedProductsList.length,
          uncompletedOrders: unviewedCount,
          totalUncompletedOrders: fetchedUncompleted.length,
          totalCustomers: (customersResult.customers || []).length,
          ordersThisMonth: monthlyOrdersCount,
          activeFlashDeals: activeDealsCount,
          allOrders: fetchedOrders,
          revenueChartData: Object.keys(dailyRevenue).map(dateKey => ({ date: dateKey, Revenue: dailyRevenue[dateKey] })),
          pendingOrders: fetchedOrders.filter((o: any) => o.status === 'pending').slice(0, 5),
          lowStockProducts: lowStockProductsList,
          pendingReviews: fetchedReviews.filter((r: any) => !r.is_approved).slice(0, 5),
          unansweredQuestions: fetchedQnaList.filter((q: any) => !q.is_approved).slice(0, 5),
        };

        setDashboard(newDashboardData);
      } catch (error: any) {
        console.error("Dashboard Fetch Error:", error);
        if (!useAdminStore.getState().dashboard) {
            toast({ variant: 'destructive', title: 'Error loading dashboard', description: error.message });
        }
      } finally {
        setIsLoading(false);
    }
  }, [user?.id, setDashboard, toast]);

  useEffect(() => {
    if (user?.id) {
        fetchDashboardStats();
    }
  }, [user?.id, fetchDashboardStats]);

  const lang = user?.language || 'bn';
  const translations = { en, bn };
  const t = translations[lang as keyof typeof translations]?.dashboard || translations.bn.dashboard;
  
  const dashboardStats = useMemo(() => dashboard || {
    totalRevenue: 0,
    totalProducts: 0,
    uncompletedOrders: 0,
    totalUncompletedOrders: 0,
    totalCustomers: 0,
    ordersThisMonth: 0,
    activeFlashDeals: 0,
    allOrders: [],
    revenueChartData: [],
    pendingOrders: [],
    lowStockProducts: [],
    pendingReviews: [],
    unansweredQuestions: [],
  }, [dashboard]);

  const showSkeleton = isLoading && !dashboard;
  const isLimitReached = user?.product_limit !== null && dashboardStats.totalProducts >= (user?.product_limit || 0);

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
        stats={dashboardStats} 
        limits={{ productLimit: user?.product_limit ?? null, customerLimit: user?.customer_limit ?? null, orderLimit: user?.order_limit ?? null }} 
        isLoading={showSkeleton} 
        t={t} 
      />

      <DashboardCharts 
        revenueChartData={dashboardStats.revenueChartData} 
        allOrders={dashboardStats.allOrders || []} 
        isLoading={showSkeleton} 
        t={t} 
      />

      <DashboardTables 
        pendingOrders={dashboardStats.pendingOrders} 
        lowStockProducts={dashboardStats.lowStockProducts}
        pendingReviews={dashboardStats.pendingReviews} 
        unansweredQuestions={dashboardStats.unansweredQuestions} 
        isLoading={showSkeleton} 
        t={t} 
      />
    </div>
  );
}
