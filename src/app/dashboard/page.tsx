'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Users,
  DollarSign,
  CreditCard,
  ArrowRight,
  Clock,
  Star,
} from 'lucide-react';
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
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { SubscriptionPaymentWithDetails } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/stores/auth';

export default function SaasAdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    pendingReviews: 0,
    pendingSubscriptions: 0,
  });
  const [pendingPayments, setPendingPayments] = useState<SubscriptionPaymentWithDetails[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saas/dashboard-data');
      const result = await response.json();

      if (response.ok) {
        setStats(result.stats);
        setPendingPayments(result.recentPendingPayments || []);
        setUnreadNotifications(result.unreadNotifications || []);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (e: any) {
      console.error("Dashboard fetch error:", e);
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, user]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">SaaS Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-bold">BDT {stats.totalRevenue.toFixed(2)}</div>}
            <p className="text-xs text-muted-foreground">
              All time from subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{stats.activeSubscriptions}</div>}
            <p className="text-xs text-muted-foreground">
              Currently active plans
            </p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{stats.pendingReviews}</div>}
            <p className="text-xs text-muted-foreground">
              Require approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Subscriptions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{stats.pendingSubscriptions}</div>}
            <p className="text-xs text-muted-foreground">
              Require manual approval
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Subscriptions</CardTitle>
                <CardDescription>
                  The most recent payments awaiting approval.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/subscriptions">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        </TableRow>
                    ))
                ) : pendingPayments.length > 0 ? (
                    pendingPayments.map((sub) => (
                    <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{sub.profiles?.full_name || 'N/A'}</span>
                                <span className="text-[10px] text-muted-foreground">@{sub.profiles?.username}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                        <Badge variant="secondary">
                            {sub.plans?.name || 'N/A'}
                        </Badge>
                        </TableCell>
                        <TableCell>
                          ৳{sub.amount.toFixed(2)}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No pending subscriptions.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Unread Notifications</CardTitle>
                <CardDescription>
                  Latest updates from store administrators.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/notifications">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : unreadNotifications.length > 0 ? (
                unreadNotifications.map((notif) => (
                  <div key={notif.id} className="flex items-start gap-4 p-4">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{notif.profiles?.full_name?.charAt(0) || 'S'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1 flex-1">
                      <p className="text-sm font-medium leading-none">
                          From: {notif.profiles?.full_name || 'System'}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
                        {notif.message}
                      </p>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      {format(new Date(notif.created_at), 'MMM d')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No unread notifications.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}