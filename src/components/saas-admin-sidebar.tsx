
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  CreditCard,
  Building,
  LogOut,
  Shapes,
  Settings,
  Bell,
  Sparkles,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import DynamicIcon from './dynamic-icon';
import Image from 'next/image';

interface SaasAdminSidebarProps {
    isMobile?: boolean;
}

export default function SaasAdminSidebar({ isMobile = false }: SaasAdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout: logoutAction } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingSubscriptionsCount, setPendingSubscriptionsCount] = useState(0);
  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    logoType: 'icon' | 'image';
    logoIcon: string;
    logoImageUrl: string | null;
  } | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  
  if (!user || !user.isSaaSAdmin) {
    return null; // Or a loading skeleton
  }

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      // Fetch notification count
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      setUnreadCount(notifCount || 0);

      // Fetch pending subscriptions count
      const { count: subCount } = await supabase
        .from('subscription_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      setPendingSubscriptionsCount(subCount || 0);
    };

    fetchCounts();

    const channel = supabase
      .channel(`saas-admin-sidebar-counts-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_payments' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
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

  const logout = async () => {
    await logoutAction();
    toast({ title: 'Logged Out' });
    router.push('/');
  }

  const adminNavLinks = [
    { href: `/dashboard`, label: 'Dashboard', icon: Home },
    { href: `/dashboard/users`, label: 'Users', icon: Users },
    { href: `/dashboard/subscriptions`, label: 'Subscriptions', icon: CreditCard, count: pendingSubscriptionsCount },
    { href: `/dashboard/plans`, label: 'Plans', icon: Shapes },
    { href: `/dashboard/features`, label: 'Features', icon: Sparkles },
    { href: `/dashboard/pages`, label: 'Pages', icon: FileText },
    { href: `/dashboard/notifications`, label: 'Notifications', icon: Bell, count: unreadCount },
    { href: `/dashboard/settings`, label: 'Settings', icon: Settings },
    { href: `/`, label: 'View Landing Page', icon: Building },
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
    const isActive = pathname.startsWith(href) && (href !== '/dashboard' || pathname === '/dashboard');
    const linkComponent = (
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

    if (isMobile) {
      return <SheetClose asChild>{linkComponent}</SheetClose>;
    }
    
    return linkComponent;
  };
  
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
  
  const SidebarContent = () => (
    <div className="flex h-full max-h-screen flex-col gap-2 text-sidebar-foreground bg-sidebar">
      {!isMobile && (
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <HeaderLogo />
        </div>
      )}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {adminNavLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className='flex-1'>
                <p className="font-semibold text-sm">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
      </div>
    </div>
  );

  if (isMobile) {
    return <SidebarContent />;
  }

  return (
    <div className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block sticky top-0 h-screen">
      <SidebarContent />
    </div>
  );
}
