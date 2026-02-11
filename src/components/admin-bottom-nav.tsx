
'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageSquare,
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
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function AdminBottomNav({ username }: { username: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(2); // Mock count

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', user.id)
        .eq('status', 'processing');
      setProcessingOrdersCount(orderCount || 0);

      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('recipient_type', 'admin')
        .eq('is_read', false);
      setUnreadNotificationsCount(notifCount || 0);
    };
    
    fetchCounts();

    const channel = supabase
      .channel(`bottom-nav-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `site_id=eq.${user.id}`,
        },
        fetchCounts
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}&recipient_type=eq.admin`,
        },
        fetchCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const navLinks = [
    {
      href: `/${username}/admin/orders`,
      label: 'Orders',
      icon: ShoppingBag,
      count: processingOrdersCount,
    },
    {
      href: `/${username}/admin/notifications`,
      label: 'Notifications',
      icon: Bell,
      count: unreadNotificationsCount,
    },
    {
      href: `/${username}/admin/live-questions`,
      label: 'Chat',
      icon: MessageSquare,
      count: unreadChatCount,
    },
    {
      href: `/${username}/admin`,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="admin-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 p-1">
      <div className="grid h-16 grid-cols-5 gap-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center justify-center p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="text-xs font-normal">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Admin Menu</SheetTitle>
              <SheetDescription>Main navigation for the admin dashboard.</SheetDescription>
            </SheetHeader>
            <AdminMobileSidebar username={username} />
          </SheetContent>
        </Sheet>

        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  'flex flex-col h-full items-center justify-center p-1 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'text-sidebar-primary bg-sidebar-accent'
                )}
              >
                <div className="relative">
                  <link.icon className="h-5 w-5" />
                  {link.count && link.count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                      {link.count}
                    </span>
                  )}
                </div>
                <span className="text-xs font-normal">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
