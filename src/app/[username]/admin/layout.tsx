'use client';

import AdminSidebar from '@/components/admin-sidebar';
import AdminBottomNav from '@/components/admin-bottom-nav';

export default function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { username: string };
}) {
  const { username } = params;
  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="grid w-full h-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <AdminSidebar username={username} />
        <div className="flex flex-col">
          <main className="flex-1 overflow-auto p-4 lg:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>
      </div>
      <AdminBottomNav username={username} />
    </div>
  );
}
