'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import SaasAdminSidebar from '@/components/saas-admin-sidebar';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PanelLeft, Loader2, Bell, X, Info } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    logoUrl: string | null;
  } | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!loading && (!user || !user.isSaaSAdmin)) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchUnreadNotifications = useCallback(async () => {
    if (!user?.isSaaSAdmin) return;
    try {
      const response = await fetch('/api/notifications/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          recipientType: 'admin',
          limit: 10
        }),
      });
      const result = await response.json();
      if (response.ok) {
        // Filter only unread ones for the sticky alert
        setUnreadNotifications(result.notifications?.filter((n: Notification) => !n.is_read) || []);
      }
    } catch (error) {
      console.error("Failed to fetch SaaS notifications:", error);
    }
  }, [user]);

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
    
    if (user?.isSaaSAdmin) {
        fetchInfo();
        fetchUnreadNotifications();
        // Poll for new notifications every minute
        const interval = setInterval(fetchUnreadNotifications, 60000);
        return () => clearInterval(interval);
    }
  }, [user, fetchUnreadNotifications]);

  const dismissNotification = async (id: string) => {
    setUnreadNotifications(prev => prev.filter(n => n.id !== id));
    try {
        await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id }),
        });
    } catch (error) {
        console.error("Failed to mark read:", error);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">প্রবেশ করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

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
      <div className="flex flex-col max-h-screen overflow-hidden">
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
          {/* Sticky Notification Alerts */}
          <div className="max-w-5xl mx-auto space-y-3 mb-6">
            {unreadNotifications.map((notif) => (
              <Alert key={notif.id} className="border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm">
                <Bell className="h-4 w-4 text-primary" />
                <AlertTitle className="font-bold flex items-center justify-between text-xs sm:text-sm">
                    সিস্টেম আপডেট
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full hover:bg-primary/10 -mt-1 -mr-2" 
                        onClick={() => dismissNotification(notif.id)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </AlertTitle>
                <AlertDescription className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-foreground/90 font-medium">{notif.message}</span>
                    <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: bn })}</p>
                  </div>
                  {notif.link && (
                    <Button asChild variant="secondary" size="sm" className="h-8 shrink-0 rounded-full font-bold">
                      <Link href={notif.link} onClick={() => dismissNotification(notif.id)}>অ্যাকশন নিন</Link>
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
