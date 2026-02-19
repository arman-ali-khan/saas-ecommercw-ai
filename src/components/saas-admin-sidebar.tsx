
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
  Store,
  Star,
  GalleryVertical,
  LayoutList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import Image from 'next/image';

interface SaasAdminSidebarProps {
    isMobile?: boolean;
}

export default function SaasAdminSidebar({ isMobile = false }: SaasAdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout: logoutAction } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [counts, setCounts] = useState({
    unreadNotifications: 0,
    pendingSubscriptions: 0,
    pendingSeoRequests: 0,
    pendingReviews: 0,
  });
  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    logoUrl: string | null;
  } | null>(null);
  const [isInfoLoading, setIsInfoLoading] = useState(true);
  
  if (!user || !user.isSaaSAdmin) {
    return null;
  }

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/saas/sidebar-counts');
        if (response.ok) {
            const data = await response.json();
            setCounts(data);
        }
      } catch (e) {
        console.error("Failed to fetch sidebar counts:", e);
      }
    };

    fetchCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);
  
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

  const logout = async () => {
    await logoutAction();
    toast({ title: 'Logged Out' });
    router.push('/');
  }

  const adminNavLinks = [
    { href: `/dashboard`, label: 'Dashboard', icon: Home },
    { href: `/dashboard/users`, label: 'Stores', icon: Store },
    { href: `/dashboard/subscriptions`, label: 'Subscriptions', icon: CreditCard, count: counts.pendingSubscriptions },
    { href: `/dashboard/plans`, label: 'Plans', icon: Shapes },
    { href: `/dashboard/features`, label: 'Features', icon: Sparkles },
    { href: `/dashboard/showcase`, label: 'Showcase', icon: GalleryVertical },
    { href: `/dashboard/section-manager`, label: 'Section Manager', icon: LayoutList },
    { href: `/dashboard/pages`, label: 'Pages', icon: FileText },
    { href: `/dashboard/reviews`, label: 'Reviews', icon: Star, count: counts.pendingReviews },
    { href: `/dashboard/notifications`, label: 'Notifications', icon: Bell, count: counts.unreadNotifications },
    { href: `/dashboard/seo-requests`, label: 'SEO Requests', icon: Sparkles, count: counts.pendingSeoRequests },
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
