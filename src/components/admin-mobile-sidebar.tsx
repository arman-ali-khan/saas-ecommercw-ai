
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileClock,
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
  Globe,
  Flame,
  ChevronDown,
  Sparkles,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';
import DynamicIcon from './dynamic-icon';
import Image from 'next/image';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';


export default function AdminMobileSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, logout: authLogout } = useAuth();
  const [processingOrdersCount, setProcessingOrdersCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unviewedUncompletedCount, setUnviewedUncompletedCount] = useState(0);
  const [totalCustomersCount, setTotalCustomersCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const [siteSettings, setSiteSettings] = useState<{
    logo_type?: 'icon' | 'image';
    logo_icon?: string;
    logo_image_url?: string;
    language?: string;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      // Fetch counts
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', user.id)
        .eq('status', 'approved');
      setProcessingOrdersCount(orderCount || 0);

      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('recipient_type', 'admin')
        .eq('is_read', false);
      setUnreadNotificationsCount(notifCount || 0);

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

      const { count: uncompletedCount } = await supabase
        .from('uncompleted_orders')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', user.id)
        .eq('is_viewed', false);
      setUnviewedUncompletedCount(uncompletedCount || 0);

      const { count: customerCount } = await supabase
        .from('customer_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', user.id);
      setTotalCustomersCount(customerCount || 0);
      
      const { count: reviewCount } = await supabase
        .from('product_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('site_id', user.id)
        .eq('is_approved', false);
      setPendingReviewsCount(reviewCount || 0);

      // Fetch site settings
      const { data: settingsData } = await supabase
        .from('store_settings')
        .select('logo_type, logo_icon, logo_image_url, language')
        .eq('site_id', user.id)
        .single();
      if (settingsData) {
        setSiteSettings(settingsData);
      }
    };
    
    fetchAllData();

    const channel = supabase
      .channel(`admin-mobile-sidebar-channel-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `site_id=eq.${user.id}` },
        fetchAllData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` },
        fetchAllData
      )
       .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_chat_messages', filter: `site_id=eq.${user.id}` },
        fetchAllData
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'uncompleted_orders',
          filter: `site_id=eq.${user.id}`,
        },
        fetchAllData
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_profiles',
          filter: `site_id=eq.${user.id}`,
        },
        fetchAllData
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'product_reviews', filter: `site_id=eq.${user.id}` },
        fetchAllData
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'store_settings',
          filter: `site_id=eq.${user.id}`,
        },
        (payload) => setSiteSettings(payload.new as any)
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

  const handleLanguageToggle = async () => {
    if(!user) return;
    const newLang = siteSettings?.language === 'bn' ? 'en' : 'bn';
    const { error } = await supabase.from('store_settings').update({ language: newLang }).eq('site_id', user.id);
    if (error) {
        toast({ title: "Failed to switch language", variant: "destructive" });
    } else {
        toast({ title: `Language switched to ${newLang === 'en' ? 'English' : 'Bengali'}` });
        window.location.reload();
    }
  };
  
  const adminNavLinks = [
    { href: `/`, label: 'View Store', icon: Home },
    { href: `/admin`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/admin/notifications`, label: 'Notifications', icon: Bell, count: unreadNotificationsCount },
    { href: `/admin/categories`, label: 'Categories', icon: Tags },
    { href: `/admin/orders`, label: 'Orders', icon: ShoppingBag, count: processingOrdersCount },
    { href: `/admin/customers`, label: 'Customers', icon: Users, count: totalCustomersCount, countVariant: 'neutral' as const },
    { href: `/admin/shipping`, label: 'Shipping', icon: Truck },
    { href: `/admin/carousel`, label: 'Carousel', icon: GalleryHorizontal },
    { href: `/admin/flash-deals`, label: 'Flash Deals', icon: Flame },
    { href: `/admin/featured-products`, label: 'Featured Products', icon: Star },
    { href: `/admin/reviews`, label: 'Reviews', icon: Star, count: pendingReviewsCount },
    { href: `/admin/features`, label: 'Store Features', icon: Sparkles },
    { href: `/admin/section-manager`, label: 'Section Manager', icon: LayoutList },
    { href: `/admin/uncompleted`, label: 'Uncompleted', icon: FileClock, count: unviewedUncompletedCount },
    { href: `/admin/pages`, label: 'Page Manager', icon: FileText },
    { href: `/admin/live-questions`, label: 'Live Questions', icon: Bot, count: unreadChatCount },
    { href: `/admin/settings`, label: 'Settings', icon: Settings },
  ];
  
  const logoType = siteSettings?.logo_type || 'icon';
  const logoIcon = siteSettings?.logo_icon || 'Leaf';
  const logoImageUrl = siteSettings?.logo_image_url;
  const language = siteSettings?.language || 'bn';

  const NavLink = ({
    href,
    label,
    icon: Icon,
    count,
    countVariant = 'destructive',
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
    count?: number;
    countVariant?: 'destructive' | 'neutral';
  }) => {
    const isBasePage = href === `/` || href === `/admin`;
    const isActive = isBasePage ? pathname === href : pathname.startsWith(href);
    const showCount = count !== undefined && (countVariant === 'neutral' || count > 0);
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
                {showCount ? (
                  <Badge className={cn("ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full", countVariant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-sidebar-accent text-sidebar-accent-foreground')}>{count}</Badge>
                ) : null}
            </Link>
      </SheetClose>
    );
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 text-sidebar-foreground bg-sidebar">
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <SheetClose asChild>
            <Link href={`/admin`} className="flex items-center gap-3">
              <div className={`${logoType === 'image' ? '' : 'bg-primary'} p-2 rounded-full flex items-center justify-center h-10 w-10`}>
                  {logoType === 'image' && logoImageUrl ? (
                  <div className="relative h-8 w-8">
                      <Image src={logoImageUrl} alt={user?.siteName || 'Logo'} fill className="object-contain rounded-sm" />
                  </div>
                  ) : (
                  <DynamicIcon name={logoIcon} className="h-6 w-6 text-primary-foreground" />
                  )}
              </div>
              <div className="text-lg font-bold font-headline">{user.siteName}</div>
            </Link>
          </SheetClose>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">

            {adminNavLinks.slice(0, 2).map((link) => (
              <NavLink key={link.href} {...link} />
            ))}

            <Collapsible>
              <CollapsibleTrigger className={cn(
                'flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg:last-child]:data-[state=open]:rotate-180',
                (pathname.startsWith('/admin/products') || pathname.startsWith('/admin/attributes')) && 'bg-sidebar-primary text-sidebar-primary-foreground'
              )}>
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  Products
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-7 space-y-1 py-1">
                <SheetClose asChild>
                  <Link href="/admin/products" className={cn("block rounded-lg px-3 py-1.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === '/admin/products' && 'text-sidebar-accent-foreground')}>All Products</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/products/new" className={cn("block rounded-lg px-3 py-1.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === '/admin/products/new' && 'text-sidebar-accent-foreground')}>Create Product</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/attributes" className={cn("block rounded-lg px-3 py-1.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === '/admin/attributes' && 'text-sidebar-accent-foreground')}>Attributes</Link>
                </SheetClose>
              </CollapsibleContent>
            </Collapsible>
            
            {adminNavLinks.slice(3, 13).map((link) => (
              <NavLink key={link.href} {...link} />
            ))}

            <Collapsible>
              <CollapsibleTrigger className={cn(
                'flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg:last-child]:data-[state=open]:rotate-180',
                pathname.startsWith('/admin/theme') && 'bg-sidebar-primary text-sidebar-primary-foreground'
              )}>
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4" />
                  Theme
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-7 space-y-1 py-1">
                <SheetClose asChild>
                  <Link href="/admin/theme/header" className={cn("block rounded-lg px-3 py-1.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === '/admin/theme/header' && 'text-sidebar-accent-foreground')}>Header</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/theme/footer" className={cn("block rounded-lg px-3 py-1.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === '/admin/theme/footer' && 'text-sidebar-accent-foreground')}>Footer</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/theme/appearance" className={cn("block rounded-lg px-3 py-1.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", pathname === '/admin/theme/appearance' && 'text-sidebar-accent-foreground')}>Appearance</Link>
                </SheetClose>
              </CollapsibleContent>
            </Collapsible>

            {adminNavLinks.slice(13).map((link) => (
              <NavLink key={link.href} {...link} />
            ))}

          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-sidebar-border space-y-2">
           <Button onClick={handleLanguageToggle} variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
             <Globe className="mr-2 h-4 w-4" />
             Switch to {language === 'bn' ? 'English' : 'Bengali'}
          </Button>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
           <SheetClose asChild>
            <Button variant="outline" className="w-full">Close Menu</Button>
          </SheetClose>
        </div>
      </div>
  );
}
