'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SaasAdminSidebar from '@/components/saas-admin-sidebar';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PanelLeft, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    logoUrl: string | null;
  } | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.isSaaSAdmin)) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchInfo = async () => {
      setIsInfoLoading(true);
      try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'settings' }),
        });
        const result = await response.json();
        
        if (response.ok && result.data) {
            setSiteInfo({
                name: result.data.platform_name || 'SaaS Admin',
                logoUrl: result.data.logo_url || null,
            });
        } else {
            setSiteInfo({ name: 'SaaS Admin', logoUrl: null });
        }
      } catch (e) {
        setSiteInfo({ name: 'SaaS Admin', logoUrl: null });
      } finally {
        setIsInfoLoading(false);
      }
    };
    fetchInfo();
  }, []);

  // Show a full-page loader while checking auth state
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  // If loading is done but no user or not saas admin, return null while redirecting
  if (!user || !user.isSaaSAdmin) {
    return null;
  }
  
  const HeaderLogo = () => {
    if (isInfoLoading || !siteInfo) {
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
      );
    }

    return (
      <Link href="/dashboard" className="flex items-center gap-3">
        {siteInfo.logoUrl ? (
          <div className="relative h-10 w-10">
            <Image src={siteInfo.logoUrl} alt={siteInfo.name} fill className="object-contain" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg">
            {siteInfo.name.charAt(0)}
          </div>
        )}
        <span className="text-xl font-bold font-headline">{siteInfo.name}</span>
      </Link>
    );
  };

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
                            <HeaderLogo />
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