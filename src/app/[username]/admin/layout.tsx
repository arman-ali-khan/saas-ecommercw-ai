'use client';

import AdminSidebar from '@/components/admin-sidebar';
import AdminBottomNav from '@/components/admin-bottom-nav';
import { useParams } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const username = params.username as string;
  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="grid w-full h-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AdminSidebar username={username} />
        <main className="overflow-auto p-4 lg:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
      <AdminBottomNav username={username} />
    </div>
  );
}
