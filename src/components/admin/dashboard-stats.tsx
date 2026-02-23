
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { DollarSign, FileClock, Flame, Package, Users, ShoppingBag } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalRevenue: number;
    uncompletedOrders: number;
    totalUncompletedOrders: number;
    activeFlashDeals: number;
    totalProducts: number;
    totalCustomers: number;
    ordersThisMonth: number;
  };
  limits: {
    productLimit: number | null;
    customerLimit: number | null;
    orderLimit: number | null;
  };
  isLoading: boolean;
  t: any;
}

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

const LimitStatCard = ({ title, value, limit, icon: Icon, isLoading, t }: { title: string, value: number, limit: number | null, icon: React.ElementType, isLoading: boolean, t: any }) => {
  const isUnlimited = limit === null;
  const isLimitReached = limit !== null && value >= limit;
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

export default function DashboardStats({ stats, limits, isLoading, t }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
      <StatCard title={t.totalRevenue} value={`BDT ${stats.totalRevenue.toFixed(2)}`} icon={DollarSign} isLoading={isLoading} description={t.allTime} />
      <StatCard title={t.newUncompleted} value={stats.uncompletedOrders} icon={FileClock} isLoading={isLoading} description={`${stats.totalUncompletedOrders} ${t.totalAbandoned}`} />
      <StatCard title={t.activeFlashDeals} value={stats.activeFlashDeals} icon={Flame} isLoading={isLoading} />
      
      <LimitStatCard 
        title={t.products} 
        value={stats.totalProducts} 
        limit={limits.productLimit} 
        icon={Package} 
        isLoading={isLoading} 
        t={t} 
      />
      <LimitStatCard 
        title={t.customers} 
        value={stats.totalCustomers} 
        limit={limits.customerLimit} 
        icon={Users} 
        isLoading={isLoading} 
        t={t} 
      />
      <LimitStatCard 
        title={t.ordersThisMonth} 
        value={stats.ordersThisMonth} 
        limit={limits.orderLimit} 
        icon={ShoppingBag} 
        isLoading={isLoading} 
        t={t} 
      />
    </div>
  );
}
