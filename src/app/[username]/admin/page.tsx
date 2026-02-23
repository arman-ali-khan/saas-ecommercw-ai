
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

const MINIMUM_STOCK_THRESHOLD = 10;

export default function AdminDashboard() {
  const { user: currentAdmin } = useAuth();
  const { dashboard: cachedDashboard, setDashboard } = useAdminStore();
  const { toast } = useToast();

  const [isDataLoading, setIsDataLoading] = useState(() => {
    return !useAdminStore.getState().dashboard;
  });

  const fetchDashboardStats = useCallback(async (forceRefresh = false) => {
    const activeSiteId = currentAdmin?.id;
    if (!activeSiteId) return;

    const storeState = useAdminStore.getState();
    const isCacheFresh = Date.now() - storeState.lastFetched.dashboard < 300000;
    
    if (!forceRefresh && storeState.dashboard && isCacheFresh) {
        setIsDataLoading(false);
        return;
    }

    if (!storeState.dashboard) {
        setIsDataLoading(true);
    }

    try {
        const lastWeekDate = subDays(new Date(), 7);

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

        const totalRevenue = fetchedOrders.filter((orderItem: any) => orderItem.status === 'delivered').reduce((acc: number, orderItem: any) => acc + orderItem.total, 0);
        const monthlyOrdersCount = fetchedOrders.filter((orderItem: any) => new Date(orderItem.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1) && orderItem.status !== 'canceled').length;
        const unviewedCount = fetchedUncompleted.filter((uncompletedItem: any) => !uncompletedItem.is_viewed).length;
        const activeDealsCount = fetchedDeals.filter((dealItem: any) => dealItem.is_active && new Date(dealItem.end_date) > new Date()).length;

        // Daily Revenue Calculation
        const dailyRevenue: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
          const d = subDays(new Date(), i);
          const dateStr = safeFormat(d, 'MMM d');
          dailyRevenue[dateStr] = 0;
        }
        
        fetchedOrders.filter((orderItem: any) => new Date(orderItem.created_at) >= lastWeekDate && orderItem.status === 'delivered').forEach((orderItem: any) => {
          const dateStr = safeFormat(new Date(orderItem.created_at), 'MMM d');
          if (Object.prototype.hasOwnProperty.call(dailyRevenue, dateStr)) {
            dailyRevenue[dateStr] += orderItem.total;
          }
        });

        // Detailed Low Stock Detection (checking variants)
        const lowStockProductsList = fetchedProductsList.filter((productItem: any) => {
            const hasLowStockVariant = productItem.variants?.some((variantItem: any) => (variantItem.stock ?? 0) < MINIMUM_STOCK_THRESHOLD);
            const hasLowBaseStock = (productItem.stock ?? 0) < MINIMUM_STOCK_THRESHOLD;
            return hasLowBaseStock || hasLowStockVariant;
        }).sort((firstProduct: any, secondProduct: any) => {
            const minA = Math.min(firstProduct.stock ?? 0, ...(firstProduct.variants?.map((v: any) => v.stock ?? 0) || []));
            const minB = Math.min(secondProduct.stock ?? 0, ...(secondProduct.variants?.map((v: any) => v.stock ?? 0) || []));
            return minA - minB;
        }).slice(0, 5);

        const updatedDashboardData = {
          totalRevenue,
          totalProducts: fetchedProductsList.length,
          uncompletedOrders: unviewedCount,
          totalUncompletedOrders: fetchedUncompleted.length,
          totalCustomers: (customersResult.customers || []).length,
          ordersThisMonth: monthlyOrdersCount,
          activeFlashDeals: activeDealsCount,
          allOrders: fetchedOrders,
          revenueChartData: Object.keys(dailyRevenue).map(keyString => ({ date: keyString, Revenue: dailyRevenue[keyString] })),
          pendingOrders: fetchedOrders.filter((orderItem: any) => orderItem.status === 'pending').slice(0, 5),
          lowStockProducts: lowStockProductsList,
          pendingReviews: fetchedReviews.filter((reviewItem: any) => !reviewItem.is_approved).slice(0, 5),
          unansweredQuestions: fetchedQnaList.filter((qnaItem: any) => !qnaItem.is_approved).slice(0, 5),
        };

        setDashboard(updatedDashboardData);
      } catch (error: any) {
        console.error("Dashboard Fetch Error:", error);
        if (!useAdminStore.getState().dashboard) {
            toast({ variant: 'destructive', title: 'Error loading dashboard', description: error.message });
        }
      } finally {
        setIsDataLoading(false);
    }
  }, [currentAdmin?.id, setDashboard, toast]);

  useEffect(() => {
    if (currentAdmin?.id) {
        fetchDashboardStats();
    }
  }, [currentAdmin?.id, fetchDashboardStats]);

  const userLanguage = currentAdmin?.language || 'bn';
  const translations = { en, bn };
  const t = translations[userLanguage as keyof typeof translations]?.dashboard || translations.bn.dashboard;
  
  const dashboardStats = useMemo(() => cachedDashboard || {
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
  }, [cachedDashboard]);

  const displaySkeleton = isDataLoading && !cachedDashboard;
  const productLimitReached = currentAdmin?.product_limit !== null && (dashboardStats.totalProducts || 0) >= (currentAdmin?.product_limit || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
      
      {productLimitReached && (
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
        limits={{ productLimit: currentAdmin?.product_limit ?? null, customerLimit: currentAdmin?.customer_limit ?? null, orderLimit: currentAdmin?.order_limit ?? null }} 
        isLoading={displaySkeleton} 
        t={t} 
      />

      <DashboardCharts 
        revenueChartData={dashboardStats.revenueChartData} 
        allOrders={dashboardStats.allOrders || []} 
        isLoading={displaySkeleton} 
        t={t} 
      />

      <DashboardTables 
        pendingOrders={dashboardStats.pendingOrders} 
        lowStockProducts={dashboardStats.lowStockProducts}
        pendingReviews={dashboardStats.pendingReviews} 
        unansweredQuestions={dashboardStats.unansweredQuestions} 
        isLoading={displaySkeleton} 
        t={t} 
      />
    </div>
  );
}
