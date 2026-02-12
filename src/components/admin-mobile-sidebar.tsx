
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileClock,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  Bot,
  Star,
  LayoutList,
  Home,
  Tags,
  Users,
  LogOut,
  Bell,
  Truck,
  GalleryHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './logo';
import { useAuth } from '@/stores/auth';
import { SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';

export default function AdminMobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, logout: authLogout } = useAuth();
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      // Fetch processing orders count
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', user.id)
        .eq('status', 'processing');
      setProcessingOrdersCount(orderCount || 0);

      // Fetch unread notifications count
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('recipient_type', 'admin')
        .eq('is_read', false);
      setUnreadNotificationsCount(notifCount || 0);

      // Fetch unread chat conversations count
      const { data: convosWithUnread } = await supabase
        .from('live_chat_messages')
        .select('conversation_id')
        .eq('site_id', user.id)
        .eq('is_read', false)
        .eq('sender_type', 'customer');
        
      if (convosWithUnread) {
          const uniqueConvoIds = [...new Set(convosWithUnread.map(c => c.conversation_id))];
          setUnreadChatCount(uniqueConvoIds.length);
      } else {
          setUnreadChatCount(0);
      }
    };
    
    fetchCounts(); // Initial fetch

    const channel = supabase
      .channel(`admin-dashboard-counts-channel-${user.id}`)
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
       .on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'live_chat_messages',
            filter: `site_id=eq.${user.id}`
        },
        fetchCounts
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  if (loading || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await authLogout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push(`/admin/login`);
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out. Please try again.',
      });
    }
  };

  const adminNavLinks = [
    { href: `/`, label: 'View Store', icon: Home },
    { href: `/admin`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/admin/notifications`, label: 'Notifications', icon: Bell, count: unreadNotificationsCount },
    { href: `/admin/products`, label: 'Products', icon: Package },
    { href: `/admin/categories`, label: 'Categories', icon: Tags },
    { href: `/admin/orders`, label: 'Orders', icon: ShoppingBag, count: processingOrdersCount },
    { href: `/admin/customers`, label: 'Customers', icon: Users },
    { href: `/admin/shipping`, label: 'Shipping', icon: Truck },
    { href: `/admin/carousel`, label: 'Carousel', icon: GalleryHorizontal },
    { href: `/admin/featured-products`, label: 'Featured Products', icon: Star },
    { href: `/admin/section-manager`, label: 'Section Manager', icon: LayoutList },
    { href: `/admin/uncompleted`, label: 'Uncompleted', icon: FileClock },
    { href: `/admin/payments`, label: 'Payments', icon: CreditCard },
    { href: `/admin/pages`, label: 'Page Manager', icon: FileText },
    { href: `/admin/reviews`, label: 'Reviews', icon: MessageSquare },
    { href: `/admin/live-questions`, label: 'Live Questions', icon: Bot, count: unreadChatCount },
    { href: `/admin/settings`, label: 'Settings', icon: Settings },
  ];

  const NavLink = ({
    href,
    label,
    icon: Icon,
    count,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
    count?: number;
  }) => {
    const isBasePage = href === `/` || href === `/admin`;
    const isActive = isBasePage ? pathname === href : pathname.startsWith(href);
    return (
        <SheetClose asChild>
            <Link
                href={href}
                className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
            >
                <Icon className="h-4 w-4" />
                {label}
                {count && count > 0 ? (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">{count}</Badge>
                ) : null}
            </Link>
      </SheetClose>
    );
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 text-sidebar-foreground bg-sidebar">
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <SheetClose asChild>
            <Link href={`/admin`}>
                <Logo />
            </Link>
          </SheetClose>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {adminNavLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
  );
}
