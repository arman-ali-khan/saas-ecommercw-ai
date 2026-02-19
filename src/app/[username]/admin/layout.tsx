'use client';

import AdminSidebar from '@/components/admin-sidebar';
import AdminBottomNav from '@/components/admin-bottom-nav';
import AdminHeader from '@/components/admin-header';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, AlertCircle, Bell, X } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { differenceInDays, isBefore, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Notification } from '@/types';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const username = params.username as string;
  const { user, loading } = useAuth();
  
  const [saasNotifications, setSaasNotifications] = useState<Notification[]>([]);

  const fetchSaasNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const response = await fetch('/api/notifications/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: user.id,
          recipientType: 'admin',
          siteId: user.id
        }),
      });
      const result = await response.json();
      if (response.ok) {
        // Show only unread notifications at the top
        setSaasNotifications(result.notifications?.filter((n: any) => !n.is_read) || []);
      }
    } catch (error) {
      console.error("Failed to fetch layout notifications:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && pathname !== `/admin/login`) {
      fetchSaasNotifications();
    }
  }, [user, pathname, fetchSaasNotifications]);

  const dismissNotification = async (id: string) => {
    // Optimistic UI update
    setSaasNotifications(prev => prev.filter(n => n.id !== id));
    
    try {
        await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id, recipientId: user?.id }),
        });
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
  };
  
  const { isSubscriptionExpired, isExpiringSoon, daysRemaining } = useMemo(() => {
    if (!user?.subscription_end_date) {
        return { isSubscriptionExpired: false, isExpiringSoon: false, daysRemaining: null };
    }
    const now = new Date();
    const endDate = new Date(user.subscription_end_date);
    const expired = isBefore(endDate, now);
    const remaining = differenceInDays(endDate, now);
    const expiring = !expired && remaining >= 0 && remaining <= 10;

    return { isSubscriptionExpired: expired, isExpiringSoon: expiring, daysRemaining: remaining };
  }, [user?.subscription_end_date]);

  const isPendingFromRegistration = user?.subscription_status === 'pending_verification' && user?.last_subscription_from === 'get-started';
  const isFailed = user?.subscription_status === 'failed';
  const isPending = (user?.subscription_status === 'pending' || isPendingFromRegistration || isFailed);
  const isBlocked = user?.subscription_status === 'inactive';
  
  const isContentDisabled = isPending || isBlocked || isSubscriptionExpired;

  useEffect(() => {
    if (!loading && pathname !== `/admin/login`) {
        if (!user || user.domain !== username) {
            router.replace(`/admin/login`);
        }
    }
  }, [user, loading, username, router, pathname]);

  // Render the login page directly
  if (pathname === `/admin/login`) {
    return <>{children}</>;
  }

  // Show a full-page loader only while the initial auth check is running.
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // After loading, if the user is invalid, we're about to redirect.
  if (!user || user.domain !== username) {
      return null;
  }
  
  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="grid w-full h-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AdminSidebar />
        <div className="flex flex-col h-full overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 md:pb-6">
            {/* SaaS Global Notifications (Alert Style) */}
            {saasNotifications.map((notif) => (
              <Alert key={notif.id} className="mb-6 border-primary bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500">
                <Bell className="h-4 w-4 text-primary" />
                <AlertTitle className="font-bold flex items-center justify-between">
                    সিস্টেম ঘোষণা
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-primary/10 -mt-1 -mr-2" 
                        onClick={() => dismissNotification(notif.id)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </AlertTitle>
                <AlertDescription className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-foreground/90">{notif.message}</span>
                  {notif.link && (
                    <Button asChild variant="secondary" size="sm" className="h-8 shrink-0">
                      <Link href={notif.link}>বিস্তারিত দেখুন</Link>
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}

            {isPending && (
              <Alert variant="destructive" className="mb-6">
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Subscription Pending</AlertTitle>
                  <AlertDescription>
                    Your subscription payment is currently being reviewed. Some features are disabled until your payment is approved.
                  </AlertDescription>
              </Alert>
            )}
            {isBlocked && (
              <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Account Blocked</AlertTitle>
                  <AlertDescription>
                    Your account has been blocked. Please contact support for assistance.
                  </AlertDescription>
              </Alert>
            )}
            {isSubscriptionExpired && !isBlocked && (
              <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Subscription Expired</AlertTitle>
                  <AlertDescription>
                    Your subscription ended on {user?.subscription_end_date ? format(new Date(user.subscription_end_date), 'PP') : 'N/A'}. 
                    Please renew your plan to continue using all features.
                  </AlertDescription>
              </Alert>
            )}
            {isExpiringSoon && !isSubscriptionExpired && !isBlocked && (
              <Alert className="mb-6 border-amber-500 text-amber-500 [&>svg]:text-amber-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Subscription Expiring Soon</AlertTitle>
                  <AlertDescription>
                    Your subscription will expire in {daysRemaining} day(s). Renew now to avoid any disruption.
                  </AlertDescription>
              </Alert>
            )}
            <fieldset disabled={isContentDisabled}>
              {children}
            </fieldset>
          </main>
        </div>
      </div>
      <AdminBottomNav />
    </div>
  );
}
