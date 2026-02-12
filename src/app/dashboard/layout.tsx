'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SaasAdminSidebar from '@/components/saas-admin-sidebar';
import { useAuth } from '@/stores/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PanelLeft } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase/client';
import DynamicIcon from '@/components/dynamic-icon';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    logoType: 'icon' | 'image';
    logoIcon: string;
    logoImageUrl: string | null;
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
      const { data } = await supabase
        .from('saas_settings')
        .select('platform_name, logo_type, logo_icon, logo_image_url')
        .eq('id', 1)
        .single();
      
      if (data) {
        setSiteInfo({
          name: data.platform_name || 'SaaS Admin',
          logoType: data.logo_type || 'icon',
          logoIcon: data.logo_icon || 'Sparkles',
          logoImageUrl: data.logo_image_url || null,
        });
      } else {
         setSiteInfo({
          name: 'SaaS Admin',
          logoType: 'icon',
          logoIcon: 'Sparkles',
          logoImageUrl: null,
        })
      }
      setIsInfoLoading(false);
    };
    fetchInfo();
  }, []);

  if (loading || !user || !user.isSaaSAdmin) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }
  
  const HeaderLogo = () => {
    if (isInfoLoading || !siteInfo) {
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      );
    }

    return (
      <Link href="/dashboard" className="flex items-center gap-3">
        <div className={`${siteInfo.logoType === 'image' ? '' : 'bg-primary'} p-2 rounded-full flex items-center justify-center h-10 w-10`}>
          {siteInfo.logoType === 'image' && siteInfo.logoImageUrl ? (
            <div className="relative h-8 w-8">
              <Image src={siteInfo.logoImageUrl} alt={siteInfo.name} fill className="object-contain rounded-sm" />
            </div>
          ) : (
            <DynamicIcon name={siteInfo.logoIcon} className="h-6 w-6 text-primary-foreground" />
          )}
        </div>
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
