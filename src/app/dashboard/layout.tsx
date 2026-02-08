'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SaasAdminSidebar from '@/components/saas-admin-sidebar';
import { useAuth } from '@/stores/auth';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PanelLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !user.isSaaSAdmin)) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user || !user.isSaaSAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <SaasAdminSidebar />
      <div className="flex flex-col max-h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden sticky top-0 bg-background z-10">
            <Sheet>
                <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0 md:hidden"
                >
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col p-0">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className='sr-only'>SaaS Admin Menu</SheetTitle>
                    </SheetHeader>
                    <div className="flex h-20 items-center border-b px-6">
                        <SheetClose asChild>
                            <Link href="/dashboard">
                                <Logo />
                            </Link>
                        </SheetClose>
                    </div>
                    <SaasAdminSidebar isMobile />
                </SheetContent>
            </Sheet>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
