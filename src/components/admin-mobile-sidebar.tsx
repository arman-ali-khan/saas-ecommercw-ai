'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileClock,
  FileText,
  Settings,
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
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';
import DynamicIcon from './dynamic-icon';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';
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
  const { sidebarCounts } = useAdminStore();

  if (!user) {
    return (
        <div className="flex h-full max-h-screen flex-col gap-2 text-card-foreground bg-card">
            <div className="flex h-20 items-center border-b border-border px-6">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </div>
            </div>
            <div className="flex-1 overflow-auto py-6 px-4 space-y-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3">
                        <Skeleton className="h-5 w-5 rounded" />
                        <Skeleton className="h-4 flex-1" />
                    </div>
                ))}
            </div>
            <div className="mt-auto p-4 border-t border-border space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
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
    const newLang = user.language === 'bn' ? 'en' : 'bn';
    const { error } = await supabase.from('store_settings').upsert({ site_id: user.id, language: newLang });
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
    { href: `/admin/notifications`, label: 'Notifications', icon: Bell, count: sidebarCounts.unreadNotifications },
    { href: `/admin/categories`, label: 'Categories', icon: Tags },
    { href: `/admin/orders`, label: 'Orders', icon: ShoppingBag, count: sidebarCounts.processingOrders },
    { href: `/admin/customers`, label: 'Customers', icon: Users, count: sidebarCounts.totalCustomers, countVariant: 'neutral' as const },
    { href: `/admin/shipping`, label: 'Shipping', icon: Truck },
    { href: `/admin/carousel`, label: 'Carousel', icon: GalleryHorizontal },
    { href: `/admin/flash-deals`, label: 'Flash Deals', icon: Flame },
    { href: `/admin/featured-products`, label: 'Featured Products', icon: Star },
    { href: `/admin/reviews`, label: 'Reviews', icon: Star, count: sidebarCounts.pendingReviews },
    { href: `/admin/qna`, label: 'Q&A', icon: HelpCircle, count: sidebarCounts.pendingQna },
    { href: `/admin/features`, label: 'Store Features', icon: Sparkles },
    { href: `/admin/section-manager`, label: 'Section Manager', icon: LayoutList },
    { href: `/admin/uncompleted`, label: 'Uncompleted', icon: FileClock, count: sidebarCounts.unviewedUncompleted },
    { href: `/admin/pages`, label: 'Page Manager', icon: FileText },
    { href: `/admin/support`, label: 'Support Forum', icon: HelpCircle },
  ];
  
  const logoType = user.logo_type || 'icon';
  const logoIcon = user.logo_icon || 'Leaf';
  const logoImageUrl = user.logo_image_url;
  const language = user.language || 'bn';

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
                'flex items-center gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary text-primary-foreground'
                )}
            >
                <Icon className="h-4 w-4" />
                <span className="flex-grow">{label}</span>
                {showCount ? (
                  <Badge className={cn("ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full", countVariant === 'destructive' ? 'bg-destructive text-destructive-foreground' : 'bg-accent text-accent-foreground')}>{count}</Badge>
                ) : null}
            </Link>
      </SheetClose>
    );
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 text-card-foreground bg-card">
        <div className="flex h-20 items-center border-b border-border px-6">
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

            {adminNavLinks.slice(0, 4).map((link) => (
              <NavLink key={link.href} {...link} />
            ))}

            <Collapsible>
              <CollapsibleTrigger className={cn(
                'flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-accent hover:text-accent-foreground [&>svg:last-child]:data-[state=open]:rotate-180',
                (pathname.startsWith('/admin/products') || pathname.startsWith('/admin/attributes')) && 'bg-primary text-primary-foreground'
              )}>
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4" />
                  Products
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-7 space-y-1 py-1">
                <SheetClose asChild>
                  <Link href="/admin/products" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/products' && 'text-accent-foreground')}>All Products</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/products/new" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/products/new' && 'text-accent-foreground')}>Create Product</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/attributes" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/attributes' && 'text-accent-foreground')}>Attributes</Link>
                </SheetClose>
              </CollapsibleContent>
            </Collapsible>
            
            {adminNavLinks.slice(4, 17).map((link) => (
              <NavLink key={link.href} {...link} />
            ))}

            <Collapsible>
              <CollapsibleTrigger className={cn(
                'flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-accent hover:text-accent-foreground [&>svg:last-child]:data-[state=open]:rotate-180',
                pathname.startsWith('/admin/theme') && 'bg-primary text-primary-foreground'
              )}>
                <div className="flex items-center gap-3">
                  <Palette className="h-4 w-4" />
                  Theme
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-7 space-y-1 py-1">
                <SheetClose asChild>
                  <Link href="/admin/theme/header" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/theme/header' && 'text-accent-foreground')}>Header</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/theme/footer" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/theme/footer' && 'text-accent-foreground')}>Footer</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/theme/appearance" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/theme/appearance' && 'text-accent-foreground')}>Appearance</Link>
                </SheetClose>
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className={cn(
                'flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-foreground transition-all hover:bg-accent hover:text-accent-foreground [&>svg:last-child]:data-[state=open]:rotate-180',
                pathname.startsWith('/admin/settings') && 'bg-primary text-primary-foreground'
              )}>
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  Settings
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-7 space-y-1 py-1">
                <SheetClose asChild>
                  <Link href="/admin/settings" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/settings' && 'text-accent-foreground')}>Store Settings</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/settings/custom-domain" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/settings/custom-domain' && 'text-accent-foreground')}>Custom Domain</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/admin/settings/ai" className={cn("block rounded-lg px-3 py-1.5 text-foreground/80 transition-all hover:bg-accent hover:text-accent-foreground", pathname === '/admin/settings/ai' && 'text-accent-foreground')}>AI Config</Link>
                </SheetClose>
              </CollapsibleContent>
            </Collapsible>

          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-border space-y-2">
           <Button onClick={handleLanguageToggle} variant="ghost" className="w-full justify-start text-foreground/70 hover:bg-accent hover:text-accent-foreground h-9 text-xs">
             <Globe className="mr-2 h-4 w-4" />
             Switch to {language === 'bn' ? 'English' : 'Bengali'}
          </Button>
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-foreground/70 hover:bg-accent hover:text-accent-foreground h-9 text-xs">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
           <SheetClose asChild>
            <Button variant="outline" className="w-full mt-2">Close Menu</Button>
          </SheetClose>
        </div>
      </div>
  );
}
