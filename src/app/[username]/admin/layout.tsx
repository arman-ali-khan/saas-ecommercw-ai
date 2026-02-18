
'use client';

import AdminSidebar from '@/components/admin-sidebar';
import AdminBottomNav from '@/components/admin-bottom-nav';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { differenceInDays, isBefore, format } from 'date-fns';

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
  // Render nothing to avoid errors from child components trying to access a null user.
  if (!user || user.domain !== username) {
      return null;
  }
  
  // If we reach here, the user is valid and loaded. Render the full dashboard layout.
  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="grid w-full h-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AdminSidebar />
        <main className="overflow-auto p-1 lg:p-6 pb-20 md:pb-6">
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
      <AdminBottomNav />
    </div>
  );
}
