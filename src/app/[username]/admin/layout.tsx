
'use client';

import AdminSidebar from '@/components/admin-sidebar';
import AdminBottomNav from '@/components/admin-bottom-nav';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useEffect } from 'react';

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
  
  // Redirect logic in useEffect
  useEffect(() => {
    // Once loading is complete, and we are not on the login page...
    if (!loading && pathname !== `/admin/login`) {
        // ...if there's no user or the user's domain doesn't match, redirect.
        if (!user || user.domain !== username) {
            router.replace(`/admin/login`);
        }
    }
  }, [user, loading, username, router, pathname]);

  // Show a full-screen loader while we check auth, unless we are on the login page.
  // This prevents content flashing before the redirect can happen.
  if (pathname !== `/admin/login` && (loading || !user || user.domain !== username)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // On the login page itself, we just render the page component,
  // which will handle its own logic (e.g., redirecting if already logged in).
  if (pathname === `/admin/login`) {
    return <>{children}</>;
  }
  
  // If we've reached this point, the user is authenticated for this admin area.
  const isPendingFromRegistration = user?.subscription_status === 'pending_verification' && user?.last_subscription_from === 'get-started';
  const isFailed = user?.subscription_status === 'failed';
  const isPending = (user?.subscription_status === 'pending' || isPendingFromRegistration || isFailed);


  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="grid w-full h-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AdminSidebar />
        <main className="overflow-auto p-4 lg:p-6 pb-20 md:pb-6">
          {isPending && (
             <Alert variant="destructive" className="mb-6">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Subscription Pending</AlertTitle>
                <AlertDescription>
                  Your subscription payment is currently being reviewed. Some features are disabled until your payment is approved.
                </AlertDescription>
            </Alert>
          )}
          <fieldset disabled={isPending}>
            {children}
          </fieldset>
        </main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
