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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './logo';
import { useAuth } from '@/stores/auth';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, logout: authLogout } = useAuth();
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    if (user) {
      // Fetch initial counts
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

      // Set up subscriptions
      const ordersChannel = supabase
        .channel(`admin-sidebar-orders-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `site_id=eq.${user.id}`}, fetchCounts)
        .subscribe();
      
      const notificationsChannel = supabase
        .channel(`admin-sidebar-notifications-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}`}, fetchCounts)
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await authLogout();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out.',
      });
      router.push(`/${username}/admin/login`);
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An error occurred while logging out. Please try again.',
      });
    }
  };
  
  if (loading || !user) {
    // You can return a loading skeleton here
    return (
      <div className="hidden border-r border-sidebar-border bg-sidebar md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-20 items-center border-b border-sidebar-border px-6">
                {/* Skeleton for logo */}
            </div>
            <div className="flex-1 overflow-auto py-2">
                {/* Skeleton for nav */}
            </div>
        </div>
      </div>
    )
  }

  const adminNavLinks = [
    { href: `/${username}`, label: 'View Store', icon: Home },
    { href: `/${username}/admin`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/${username}/admin/notifications`, label: 'Notifications', icon: Bell, count: unreadNotificationsCount },
    { href: `/${username}/admin/products`, label: 'Products', icon: Package },
    { href: `/${username}/admin/categories`, label: 'Categories', icon: Tags },
    { href: `/${username}/admin/orders`, label: 'Orders', icon: ShoppingBag, count: processingOrdersCount },
    { href: `/${username}/admin/customers`, label: 'Customers', icon: Users },
    { href: `/${username}/admin/featured-products`, label: 'Featured Products', icon: Star },
    { href: `/${username}/admin/section-manager`, label: 'Section Manager', icon: LayoutList },
    { href: `/${username}/admin/uncompleted`, label: 'Uncompleted', icon: FileClock },
    { href: `/${username}/admin/payments`, label: 'Payments', icon: CreditCard },
    { href: `/${username}/admin/pages`, label: 'Page Manager', icon: FileText },
    { href: `/${username}/admin/reviews`, label: 'Reviews', icon: MessageSquare },
    { href: `/${username}/admin/live-questions`, label: 'Live Questions', icon: Bot },
    { href: `/${username}/admin/settings`, label: 'Settings', icon: Settings },
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
    const isBasePage = href === `/${username}` || href === `/${username}/admin`;
    const isActive = isBasePage ? pathname === href : pathname.startsWith(href);
    return (
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
    );
  };

  return (
    <div className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <Link href={`/${username}/admin`}>
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {adminNavLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className='space-y-4'>
              <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                      <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                      <p className="text-sm font-semibold text-sidebar-foreground">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
              </div>
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
              </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
