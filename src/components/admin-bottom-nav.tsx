'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  PanelLeft,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import AdminMobileSidebar from './admin-mobile-sidebar';
import { useAuth } from '@/stores/auth';
import { useEffect, useState, useCallback } from 'react';

export default function AdminBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    const siteId = user?.id;
    if (!siteId) return;

    try {
        const response = await fetch('/api/admin/dashboard-counts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId }),
        });
        const result = await response.json();
        
        if (response.ok && result.counts) {
            setProcessingOrdersCount(result.counts.processingOrders);
            setUnreadNotificationsCount(result.counts.unreadNotifications);
        }
    } catch (error) {
        console.error("Failed to fetch dashboard counts (bottom nav):", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    fetchCounts();
  }, [user, fetchCounts]);

  const navLinks = [
    {
      href: `/admin/products`,
      label: 'Products',
      icon: Package,
    },
    {
      href: `/admin/orders`,
      label: 'Orders',
      icon: ShoppingBag,
      count: processingOrdersCount,
    },
    {
      href: `/admin/notifications`,
      label: 'Inbox',
      icon: Bell,
      count: unreadNotificationsCount,
    },
    {
      href: `/admin`,
      label: 'Home',
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="admin-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 p-1">
      <div className="grid h-16 grid-cols-5 gap-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center justify-center p-1 text-card-foreground/70 hover:bg-accent hover:text-accent-foreground"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="text-[10px] font-normal">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-card border-r-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin Menu</SheetTitle>
              <SheetDescription>Main navigation for the admin dashboard.</SheetDescription>
            </SheetHeader>
            <AdminMobileSidebar />
          </SheetContent>
        </Sheet>

        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  'flex flex-col h-full items-center justify-center p-1 rounded-md text-card-foreground/70 hover:bg-accent hover:text-accent-foreground',
                  isActive && 'text-primary bg-accent'
                )}
              >
                <div className="relative">
                  <link.icon className="h-5 w-5" />
                  {link.count && link.count > 0 ? (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {link.count}
                    </span>
                  ):''}
                </div>
                <span className="text-[10px] font-normal">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
