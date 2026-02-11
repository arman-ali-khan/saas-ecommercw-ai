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

      try {
        const profilesPromise = supabase.from('profiles').select('*', { count: 'exact' });
        const paymentsPromise = supabase.from('subscription_payments').select('*');
        const notificationsPromise = supabase
          .from('notifications')
          .select('*')
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
        const totalRevenue = paymentsData?.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0) || 0;
        const activeSubscriptions = profilesData?.filter(p => p.subscription_status === 'active').length || 0;
        const pendingSubscriptionsCount = paymentsData?.filter(p => p.status === 'pending').length || 0;

        setStats({
          totalRevenue,
          activeSubscriptions,
          totalUsers: totalUsers || 0,
          pendingSubscriptions: pendingSubscriptionsCount,
        });

        // Manually "join" data for pending payments
        const pending = paymentsData?.filter(p => p.status === 'pending').slice(0, 5) || [];
        if (pending.length > 0) {
            const userIdsForPending = [...new Set(pending.map(p => p.user_id))];
            const planIdsForPending = [...new Set(pending.map(p => p.plan_id).filter(Boolean))];

            const { data: pendingProfilesData } = await supabase.from('profiles').select('id, full_name, username').in('id', userIdsForPending);
            const { data: pendingPlansData } = await supabase.from('plans').select('id, name').in('id', planIdsForPending);

            const pendingProfilesMap = new Map((pendingProfilesData || []).map(p => [p.id, p]));
            const pendingPlansMap = new Map((pendingPlansData || []).map(p => [p.id, p]));

            const pendingWithDetails = pending.map(payment => ({
                ...payment,
                profiles: pendingProfilesMap.get(payment.user_id) || null,
                plans: payment.plan_id ? pendingPlansMap.get(payment.plan_id) || null : null,
            }));
            setPendingPayments(pendingWithDetails as SubscriptionPaymentWithDetails[]);
        } else {
            setPendingPayments([]);
        }

        // Manually "join" data for unread notifications
        if (notificationsData && notificationsData.length > 0) {
            const adminRecipientIds = notificationsData.filter(n => n.recipient_type === 'admin').map(n => n.recipient_id);
            
            if (adminRecipientIds.length > 0) {
                const { data: notifProfilesData } = await supabase.from('profiles').select('id, full_name, username').in('id', adminRecipientIds);
                const notifProfilesMap = new Map((notifProfilesData || []).map(p => [p.id, p]));
                
                const notificationsWithDetails = notificationsData.map(notification => ({
                    ...notification,
                    profiles: notifProfilesMap.get(notification.recipient_id) || null,
                })).filter(n => n.recipient_type === 'admin'); // Only show admin notifications on SaaS dash
                setUnreadNotifications(notificationsWithDetails);
            } else {
                 setUnreadNotifications([]);
            }
        } else {
            setUnreadNotifications([]);
        }

      } catch (e: any) {
        console.error("Dashboard fetchData catch block error:", e);
      } finally {
        setIsLoading(false);
      }
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
