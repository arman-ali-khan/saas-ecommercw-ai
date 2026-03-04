'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  DollarSign, 
  CreditCard, 
  ArrowRight, 
  Clock, 
  Star,
  TrendingUp,
  Users,
  MousePointer2
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, prefix = '' }: TooltipProps<number, string> & { prefix?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border-2 rounded-xl p-3 shadow-xl text-xs font-bold ring-2 ring-primary/10">
        <p className="text-muted-foreground mb-1 uppercase tracking-tighter">{label}</p>
        <p className="text-primary text-base">
          {prefix}{payload[0].value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function SaasAdminDashboard() {
  const { user } = useAuth();
  const { dashboardData, setDashboardData } = useSaasStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(() => {
    return !useSaasStore.getState().dashboardData;
  });

  const fetchDashboardData = useCallback(async (force = false) => {
    const currentStore = useSaasStore.getState();
    const now = Date.now();
    const isFresh = now - currentStore.lastFetched.dashboard < 300000;
    
    if (!force && currentStore.dashboardData && isFresh) {
        setIsLoading(false);
        return;
    }

    if (!currentStore.dashboardData) {
        setIsLoading(true);
    }

    try {
      const response = await fetch('/api/saas/dashboard-data');
      const result = await response.json();

      if (response.ok) {
        setDashboardData(result);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (e: any) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [setDashboardData]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user]);
  
  const stats = dashboardData?.stats || {
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingReviews: 0,
    pendingSubscriptions: 0,
  };
  const pendingPayments = dashboardData?.recentPendingPayments || [];
  const unreadNotifications = dashboardData?.unreadNotifications || [];
  const weeklyTrends = dashboardData?.weeklyTrends || { revenue: [], visitors: [], subscriptions: [] };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">SaaS Overview</h1>
            <p className="text-muted-foreground mt-1">Platform performance and subscription analytics.</p>
        </div>
        <Button variant="outline" className="rounded-full h-10 px-6 font-bold" onClick={() => fetchDashboardData(true)}>
            Refresh Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 shadow-sm bg-primary/5 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading && !dashboardData ? <Skeleton className="h-8 w-24" /> : <div className="text-3xl font-black">৳{stats.totalRevenue.toLocaleString()}</div>}
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">All-time earnings</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Active Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !dashboardData ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-black">+{stats.activeSubscriptions}</div>}
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Paid stores</p>
          </CardContent>
        </Card>
         <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Pending Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !dashboardData ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-black">+{stats.pendingReviews}</div>}
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Manual Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading && !dashboardData ? <Skeleton className="h-8 w-12" /> : <div className="text-3xl font-black">+{stats.pendingSubscriptions}</div>}
            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase">New requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Primary Weekly Revenue Chart */}
      <Card className="border-2 shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-6">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Revenue Trend (Last 7 Days)
                    </CardTitle>
                    <CardDescription>Daily successful subscription earnings.</CardDescription>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-muted-foreground uppercase">This Week</p>
                    <p className="text-2xl font-black text-primary">৳{weeklyTrends.revenue.reduce((s, r) => s + r.amount, 0).toLocaleString()}</p>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-8 pb-4">
            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyTrends.revenue}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 'bold' }} 
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 'bold' }} 
                            tickFormatter={(v) => `৳${v}`}
                        />
                        <Tooltip content={<CustomTooltip prefix="৳" />} />
                        <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={3} 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Visitor Bar Chart */}
        <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
                    <MousePointer2 className="h-4 w-4 text-blue-500" />
                    Visitor Traffic
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyTrends.visitors}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Weekly Subscriptions Bar Chart */}
        <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="p-6 border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Users className="h-4 w-4 text-green-500" />
                    New Activations
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyTrends.subscriptions}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.5)" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Subscriptions</CardTitle>
                <CardDescription>Review manual payment verification requests.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full h-8 px-4 font-bold">
                  <Link href="/dashboard/subscriptions">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && !dashboardData ? (
                    [...Array(3)].map((_, index) => (
                        <TableRow key={index}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        </TableRow>
                    ))
                ) : pendingPayments.length > 0 ? (
                    pendingPayments.map((subItem) => (
                    <TableRow key={subItem.id}>
                        <TableCell className="font-medium py-3">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{subItem.profiles?.full_name || 'N/A'}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">@{subItem.profiles?.username}</span>
                            </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{subItem.plans?.name || 'N/A'}</Badge></TableCell>
                        <TableCell className="font-black">৳{subItem.amount.toFixed(2)}</TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No pending subscriptions.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-2">
           <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Alerts and requests from store owners.</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full h-8 px-4 font-bold">
                  <Link href="/dashboard/notifications">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading && !dashboardData ? (
                [...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-start gap-4 p-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : unreadNotifications.length > 0 ? (
                unreadNotifications.map((notifItem) => (
                  <div key={notifItem.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-10 w-10 border-2 border-primary/10">
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{notifItem.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1 flex-1">
                      <p className="text-xs font-black uppercase tracking-tight leading-none text-primary">{notifItem.profiles?.site_name || 'System'}</p>
                      <p className="text-sm font-medium line-clamp-1">{notifItem.message}</p>
                      <p className="text-[10px] text-muted-foreground">{format(new Date(notifItem.created_at), 'MMM d, p')}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
