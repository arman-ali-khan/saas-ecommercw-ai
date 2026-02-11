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
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import type { SubscriptionPaymentWithDetails } from '@/types';

export default function SaasAdminDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalUsers: 0,
    pendingSubscriptions: 0,
  });
  const [pendingPayments, setPendingPayments] = useState<SubscriptionPaymentWithDetails[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const profilesPromise = supabase.from('profiles').select('*', { count: 'exact' });
      const paymentsPromise = supabase.from('subscription_payments').select('*, plans(name), profiles(full_name, username)');
      const notificationsPromise = supabase
        .from('notifications')
        .select('*, profiles!notifications_recipient_id_fkey(full_name, username)')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);

      const [
        { data: profilesData, count: totalUsers, error: profilesError },
        { data: paymentsData, error: paymentsError },
        { data: notificationsData, error: notificationsError },
      ] = await Promise.all([profilesPromise, paymentsPromise, notificationsPromise]);

      if (profilesError || paymentsError || notificationsError) {
        console.error("Dashboard fetch error:", profilesError || paymentsError || notificationsError);
        setIsLoading(false);
        return;
      }

      // Calculate stats
      const totalRevenue = paymentsData
        ?.filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const activeSubscriptions = profilesData
        ?.filter(p => p.subscription_status === 'active')
        .length || 0;

      const pendingSubscriptionsCount = paymentsData
        ?.filter(p => p.status === 'pending')
        .length || 0;

      setStats({
        totalRevenue,
        activeSubscriptions,
        totalUsers: totalUsers || 0,
        pendingSubscriptions: pendingSubscriptionsCount,
      });

      // Using the types from the join directly
      setPendingPayments((paymentsData?.filter(p => p.status === 'pending').slice(0, 5) || []) as SubscriptionPaymentWithDetails[]);
      setUnreadNotifications(notificationsData || []);

      setIsLoading(false);
    };

    fetchData();
  }, []);
  
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
            <div className="text-2xl font-bold">BDT {stats.totalRevenue.toFixed(2)}</div>
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
            <div className="text-2xl font-bold">+{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active plans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total registered site owners
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Subscriptions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.pendingSubscriptions}</div>
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
                  The 5 most recent payments awaiting approval.
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
                        <TableCell className="font-medium">{sub.profiles?.full_name || 'N/A'}</TableCell>
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
                <CardTitle>Unread Notifications</CardTitle>
                <CardDescription>
                  The 5 latest unread notifications across the platform.
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                  <Link href="/dashboard/notifications">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        </TableRow>
                    ))
                ) : unreadNotifications.length > 0 ? (
                    unreadNotifications.map((notif) => (
                    <TableRow key={notif.id}>
                        <TableCell className="font-medium">{notif.profiles?.full_name || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-xs">{notif.message}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{format(new Date(notif.created_at), 'PP')}</TableCell>
                    </TableRow>
                    ))
                 ) : (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No unread notifications.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
