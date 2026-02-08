'use client';

import AdminSidebar from '@/components/admin-sidebar';
import AdminBottomNav from '@/components/admin-bottom-nav';
import { useParams } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();

  const isPending = user?.subscription_status === 'pending' || user?.subscription_status === 'pending_verification';

  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="grid w-full h-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AdminSidebar username={username} />
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
      <AdminBottomNav username={username} />
    </div>
  );
}
