
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import Link from 'next/link';
import { format, subDays } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Ban, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

// Modular Components
import DashboardStats from '@/components/admin/dashboard-stats';
import DashboardCharts from '@/components/admin/dashboard-charts';
import DashboardTables from '@/components/admin/dashboard-tables';

const translations = { en, bn };

export default function AdminDashboard() {
  const { user } = useAuth();
  const { dashboard, setDashboard } = useAdminStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(() => {
    return !useAdminStore.getState().dashboard;
  });

  const fetchData = useCallback(async (force = false) => {
    const siteId = user?.id;
    if (!siteId) return;

    const currentStore = useAdminStore.getState();
    const now = Date.now();
    const isFresh = now - currentStore.lastFetched.dashboard < 300000;
    
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
          fetch('/api/orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/products/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/uncompleted-orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/customers/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/flash-deals/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/reviews/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
          fetch('/api/qna/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) }),
        ]);

        const [ordersResult, productsResult, uncompletedResult, customersResult, flashDealsResult, reviewsResult, qnaResult] = await Promise.all([
          ordersRes.json(), 
          productsRes.json(), 
          uncompletedRes.json(), 
          customersRes.json(), 
          flashDealsRes.json(), 
          reviewsRes.json(), 
          qnaResult = qnaRes.json()
        ]);

        const fetchedOrders = ordersResult.orders || [];
        const fetchedProducts = productsResult.products || [];
        const fetchedUncompleted = uncompletedResult.orders || [];
        const fetchedDeals = flashDealsResult.deals || [];
        const fetchedReviews = reviewsResult.reviews || [];
        const fetchedQna = qnaResult.qna || [];

        const totalRevenue = fetchedOrders.filter((o: any) => o.status === 'delivered').reduce((acc: number, o: any) => acc + o.total, 0);
        const monthlyOrdersCount = fetchedOrders.filter((o: any) => new Date(o.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1) && o.status !== 'canceled').length;
        const unviewedCount = fetchedUncompleted.filter((o: any) => !o.is_viewed).length;
        const activeDealsCount = fetchedDeals.filter((d: any) => d.is_active && new Date(d.end_date) > new Date()).length;

        const dailyRevenue: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
          const dateStr = format(subDays(new Date(), i), 'MMM d');
          dailyRevenue[dateStr] = 0;
        }
        fetchedOrders.filter((o: any) => new Date(o.created_at) >= sevenDaysAgo && o.status === 'delivered').forEach((o: any) => {
          const dateStr = format(new Date(o.created_at), 'MMM d');
          if (Object.prototype.hasOwnProperty.call(dailyRevenue, dateStr)) dailyRevenue[dateStr] += o.total;
        });

        const LOW_STOCK_THRESHOLD = 10;

        const newDashboardData = {
          totalRevenue,
          totalProducts: fetchedProducts.length,
          uncompletedOrders: unviewedCount,
          totalUncompletedOrders: fetchedUncompleted.length,
          totalCustomers: (customersResult.customers || []).length,
          ordersThisMonth: monthlyOrdersCount,
          activeFlashDeals: activeDealsCount,
          allOrders: fetchedOrders,
          revenueChartData: Object.keys(dailyRevenue).map(dateKey => ({ date: dateKey, Revenue: dailyRevenue[dateKey] })),
          pendingOrders: fetchedOrders.filter((o: any) => o.status === 'pending').slice(0, 5),
          lowStockProducts: fetchedProducts.filter((p: any) => {
            // Check main stock for simple products
            if (!p.variants || p.variants.length === 0) {
              return p.stock !== null && p.stock < LOW_STOCK_THRESHOLD;
            }
            // Check if any variant is low stock
            return p.variants.some((v: any) => v.stock !== null && v.stock < LOW_STOCK_THRESHOLD);
          }).slice(0, 5),
          pendingReviews: fetchedReviews.filter((r: any) => !r.is_approved).slice(0, 5),
          unansweredQuestions: fetchedQna.filter((q: any) => !q.is_approved).slice(0, 5),
        };

        setDashboard(newDashboardData);
      } catch (error: any) {
        console.error("Dashboard Fetch Error:", error);
        toast({ variant: 'destructive', title: 'Error loading dashboard', description: error.message });
      } finally {
        setIsLoading(false);
    }
  }, [user?.id, setDashboard, toast]);

  useEffect(() => {
    if (user?.id) {
        fetchData();
    }
  }, [user?.id, fetchData]);

  if (isLoading && !dashboard) {
    return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  const lang = user?.language || 'bn';
  const currentTranslations = translations[lang as keyof typeof translations]?.dashboard || translations.bn.dashboard;
  const productLimit = user?.product_limit;
  
  const stats = dashboard || {
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
  };

  const isLimitReached = (productLimit !== null && stats.totalProducts >= productLimit);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{currentTranslations.title}</h1>
      
      {isLimitReached && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>{currentTranslations.limitReached}</AlertTitle>
          <AlertDescription>
            {currentTranslations.limitDesc} <Link href="/admin/settings" className="font-semibold underline">{currentTranslations.upgrade}</Link> {currentTranslations.limitDesc2}
          </AlertDescription>
        </Alert>
      )}

      <DashboardStats 
        stats={stats} 
        limits={{ productLimit: user?.product_limit ?? null, customerLimit: user?.customer_limit ?? null, orderLimit: user?.order_limit ?? null }} 
        isLoading={isLoading && !dashboard} 
        t={currentTranslations} 
      />

      <DashboardCharts 
        revenueChartData={stats.revenueChartData} 
        allOrders={stats.allOrders || []} 
        isLoading={isLoading && !dashboard} 
        t={currentTranslations} 
      />

      <DashboardTables 
        pendingOrders={stats.pendingOrders} 
        lowStockProducts={stats.lowStockProducts} 
        pendingReviews={stats.pendingReviews} 
        unansweredQuestions={stats.unansweredQuestions} 
        isLoading={isLoading && !dashboard} 
        t={currentTranslations} 
      />
    </div>
  );
}
