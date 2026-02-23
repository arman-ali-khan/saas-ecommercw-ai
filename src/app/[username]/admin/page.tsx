'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { subDays, format as safeDateFormatter } from 'date-fns';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Ban, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import en from '@/locales/en.json';
import bn from '@/locales/bn.json';

// Modular Components
import DashboardStats from '@/components/admin/dashboard-stats';
import DashboardCharts from '@/components/admin/dashboard-charts';
import DashboardTables from '@/components/admin/dashboard-tables';

const MINIMUM_QUANTITY_THRESHOLD = 10;

export default function AdminDashboard() {
  const overviewRouteParams = useParams();
  const activeAdminUser = useAuth((state) => state.user);
  const globalAdminStore = useAdminStore();
  const { toast } = useToast();

  const [isDataLoading, setIsDataLoading] = useState(() => {
    return !useAdminStore.getState().dashboard;
  });

  const fetchDashboardStats = useCallback(async (forceRefreshAction = false) => {
    const activeSiteIdentifier = activeAdminUser?.id;
    if (!activeSiteIdentifier) return;

    const storeCurrentState = useAdminStore.getState();
    const isCacheDataFresh = Date.now() - storeCurrentState.lastFetched.dashboard < 300000;
    
    if (!forceRefreshAction && storeCurrentState.dashboard && isCacheDataFresh) {
        setIsDataLoading(false);
        return;
    }

    if (!storeCurrentState.dashboard) {
        setIsDataLoading(true);
    }

    try {
        const lastWeekDateTime = subDays(new Date(), 7);

        const [ordersResponse, productsResponse, uncompletedResponse, customersResponse, flashDealsResponse, reviewsResponse, qnaResponse] = await Promise.all([
          fetch('/api/orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteIdentifier }) }),
          fetch('/api/products/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteIdentifier }) }),
          fetch('/api/uncompleted-orders/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteIdentifier }) }),
          fetch('/api/customers/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteIdentifier }) }),
          fetch('/api/flash-deals/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteIdentifier }) }),
          fetch('/api/reviews/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteIdentifier }) }),
          fetch('/api/qna/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId: activeSiteIdentifier }) }),
        ]);

        const [ordersData, productsData, uncompletedData, customersData, flashDealsData, reviewsData, qnaData] = await Promise.all([
          ordersResponse.json(), 
          productsResponse.json(), 
          uncompletedResponse.json(), 
          customersResponse.json(), 
          flashDealsResponse.json(), 
          reviewsResponse.json(), 
          qnaResponse.json()
        ]);

        const finalOrders = Array.isArray(ordersData.orders) ? ordersData.orders : [];
        const finalProducts = Array.isArray(productsData.products) ? productsData.products : [];
        const finalUncompleted = Array.isArray(uncompletedData.orders) ? uncompletedData.orders : [];
        const finalDeals = Array.isArray(flashDealsData.deals) ? flashDealsData.deals : [];
        const finalReviews = Array.isArray(reviewsData.reviews) ? reviewsData.reviews : [];
        const finalQna = Array.isArray(qnaData.qna) ? qnaData.qna : [];

        const totalRevenueCalculated = finalOrders.filter((ordRecord: any) => ordRecord.status === 'delivered').reduce((accumulator: number, ordRecord: any) => accumulator + (ordRecord.total || 0), 0);
        const monthlyOrdersCounted = finalOrders.filter((ordRecord: any) => new Date(ordRecord.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1) && ordRecord.status !== 'canceled').length;
        const unviewedCartsCount = finalUncompleted.filter((ucRecord: any) => !ucRecord.is_viewed).length;
        const activeFlashDealsCount = finalDeals.filter((dealRecord: any) => dealRecord.is_active && new Date(dealRecord.end_date) > new Date()).length;

        // Daily Revenue Calculation
        const dailyRevenueMap: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
          const dayInstance = subDays(new Date(), i);
          const dateLabelString = safeDateFormatter(dayInstance, 'MMM d');
          dailyRevenueMap[dateLabelString] = 0;
        }
        
        finalOrders.filter((ordRecord: any) => new Date(ordRecord.created_at) >= lastWeekDateTime && ordRecord.status === 'delivered').forEach((ordRecord: any) => {
          const dateLabelString = safeDateFormatter(new Date(ordRecord.created_at), 'MMM d');
          if (Object.prototype.hasOwnProperty.call(dailyRevenueMap, dateLabelString)) {
            dailyRevenueMap[dateLabelString] += (ordRecord.total || 0);
          }
        });

        // Advanced Low Stock Detection
        const detectedLowStockItems = finalProducts.filter((individualItemRecord: any) => {
            const hasVariants = individualItemRecord.variants && Array.isArray(individualItemRecord.variants) && individualItemRecord.variants.length > 0;
            
            if (hasVariants) {
                return individualItemRecord.variants.some((vItemRecord: any) => (vItemRecord.stock ?? 0) < MINIMUM_QUANTITY_THRESHOLD);
            }
            return (individualItemRecord.stock ?? 0) < MINIMUM_QUANTITY_THRESHOLD;
        }).sort((aItemRecord: any, bItemRecord: any) => {
            const getEffectiveStock = (productItemForStock: any) => {
                const hasV = productItemForStock.variants && Array.isArray(productItemForStock.variants) && productItemForStock.variants.length > 0;
                if (hasV) return Math.min(...productItemForStock.variants.map((vInnerRecord: any) => vInnerRecord.stock ?? 0));
                return productItemForStock.stock ?? 0;
            };
            return getEffectiveStock(aItemRecord) - getEffectiveStock(bItemRecord);
        }).slice(0, 5);

        const comprehensiveDashboardData = {
          totalRevenue: totalRevenueCalculated,
          totalProducts: finalProducts.length,
          uncompletedOrders: unviewedCartsCount,
          totalUncompletedOrders: finalUncompleted.length,
          totalCustomers: (customersData.customers || []).length,
          ordersThisMonth: monthlyOrdersCounted,
          activeFlashDeals: activeFlashDealsCount,
          allOrders: finalOrders,
          revenueChartData: Object.keys(dailyRevenueMap).map(dateKey => ({ date: dateKey, Revenue: dailyRevenueMap[dateKey] })),
          pendingOrders: finalOrders.filter((ordRecord: any) => ordRecord.status === 'pending').slice(0, 5),
          lowStockProducts: detectedLowStockItems,
          pendingReviews: finalReviews.filter((revRecord: any) => !revRecord.is_approved).slice(0, 5),
          unansweredQuestions: finalQna.filter((qnaRecord: any) => !qnaRecord.is_approved).slice(0, 5),
        };

        globalAdminStore.setDashboard(comprehensiveDashboardData);
      } catch (dashboardFetchError: any) {
        console.error("Dashboard Stats Processing Error:", dashboardFetchError);
        if (!useAdminStore.getState().dashboard) {
            toast({ variant: 'destructive', title: 'Error loading dashboard', description: dashboardFetchError.message });
        }
      } finally {
        setIsDataLoading(false);
    }
  }, [activeAdminUser?.id, globalAdminStore, toast]);

  useEffect(() => {
    if (activeAdminUser?.id) {
        fetchDashboardStats();
    }
  }, [activeAdminUser?.id, fetchDashboardStats]);

  const activeLanguage = activeAdminUser?.language || 'bn';
  const dashboardTranslationsForApp = { en, bn };
  const currentLangStrings = dashboardTranslationsForApp[activeLanguage as keyof typeof dashboardTranslationsForApp]?.dashboard || dashboardTranslationsForApp.bn.dashboard;
  
  const dashboardDisplayStats = useMemo(() => globalAdminStore.dashboard || {
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
  }, [globalAdminStore.dashboard]);

  const shouldShowSkeleton = isDataLoading && !globalAdminStore.dashboard;
  const isProductLimitHit = activeAdminUser?.product_limit !== null && (dashboardDisplayStats.totalProducts || 0) >= (activeAdminUser?.product_limit || 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">{currentLangStrings.title}</h1>
      
      {isProductLimitHit && (
        <Alert variant="destructive">
          <Ban className="h-4 w-4" />
          <AlertTitle>{currentLangStrings.limitReached}</AlertTitle>
          <AlertDescription>
            {currentLangStrings.limitDesc} <Link href="/admin/settings" className="font-semibold underline">{currentLangStrings.upgrade}</Link> {currentLangStrings.limitDesc2}
          </AlertDescription>
        </Alert>
      )}

      <DashboardStats 
        stats={dashboardDisplayStats} 
        limits={{ 
            productLimit: activeAdminUser?.product_limit ?? null, 
            customerLimit: activeAdminUser?.customer_limit ?? null, 
            orderLimit: activeAdminUser?.order_limit ?? null 
        }} 
        isLoading={shouldShowSkeleton} 
        t={currentLangStrings} 
      />

      <DashboardCharts 
        revenueChartData={dashboardDisplayStats.revenueChartData} 
        allOrders={dashboardDisplayStats.allOrders || []} 
        isLoading={shouldShowSkeleton} 
        t={currentLangStrings} 
      />

      <DashboardTables 
        pendingOrders={dashboardDisplayStats.pendingOrders} 
        lowStockProducts={dashboardDisplayStats.lowStockProducts}
        pendingReviews={dashboardDisplayStats.pendingReviews} 
        unansweredQuestions={dashboardDisplayStats.unansweredQuestions} 
        isLoading={shouldShowSkeleton} 
        t={currentLangStrings} 
      />
    </div>
  );
}
