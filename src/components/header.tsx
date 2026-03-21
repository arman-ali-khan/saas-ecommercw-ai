
'use client';

import Link from 'next/link';
import { Menu, User, LogOut, LayoutDashboard, Bell, Sun, Moon, ArrowLeft, Search, ShoppingBag, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from './ui/button';
import ShoppingCart from './shopping-cart';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';
import { type Notification, type HeaderLink } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import DynamicIcon from './dynamic-icon';
import Image from 'next/image';
import { useSearchStore } from '@/stores/useSearchStore';
import { Input } from './ui/input';

type SiteInfo = {
  id: string;
  name: string;
  description: string | null;
  logoType: 'icon' | 'image';
  logoIcon: string;
  logoImageUrl: string | null;
} | null;

interface HeaderProps {
    siteInfo: SiteInfo;
    navLinks: HeaderLink[];
    isLoading: boolean;
    variant?: string;
}

function CustomerNotificationBell() {
  const { customer } = useCustomerAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchAndSetNotifications = useCallback(async () => {
    if (!customer) return;

    try {
        const response = await fetch('/api/get-customer-notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId: customer.id, siteId: customer.site_id }),
        });
        if (response.ok) {
            const result = await response.json();
            const data = result.notifications;
            if (data) {
                setNotifications(data.slice(0, 5));
                setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
            }
        }
    } catch (error) {
        console.error("Failed to fetch notifications for bell:", error);
    }
  }, [customer]);

  useEffect(() => {
    if (customer) {
      fetchAndSetNotifications();

      const channel = supabase
        .channel(`customer-notifications-realtime-${customer.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${customer.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setNotifications(prev => [newNotification, ...prev].slice(0, 5));
            setUnreadCount(prev => prev + 1);
            toast({ title: 'New Notification!', description: newNotification.message });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [customer, fetchAndSetNotifications, toast]);


  const handleMarkAsRead = async (id: string) => {
    if (!customer) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await fetch('/api/mark-notification-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id, customerId: customer.id }),
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} asChild>
              <Link
                href={n.link || '#'}
                className={cn('cursor-pointer', !n.is_read && 'font-bold')}
                onClick={() => handleMarkAsRead(n.id)}
              >
                <div className="flex flex-col gap-1 w-full">
                  <p className="text-sm whitespace-normal">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), {
                      addSuffix: true,
                      locale: bn,
                    })}
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-2 text-sm text-muted-foreground">
            No new notifications.
          </p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/profile/notifications`}
            className="justify-center cursor-pointer"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header({ siteInfo, navLinks, isLoading: isSiteInfoLoading, variant = 'v1' }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { isSearchOpen, setSearchOpen } = useSearchStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const newMode = !isDark;
    setIsDark(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    window.dispatchEvent(new Event('theme-toggle'));
  };

  const { user: siteOwner, loading: siteOwnerLoading, logout: siteOwnerLogout } = useAuth();
  const { customer, customerLogout, _hasHydrated: customerHasHydrated } = useCustomerAuth();

  const currentUser = siteOwner
    ? { type: 'admin', name: siteOwner.fullName, email: siteOwner.email, isSaaSAdmin: siteOwner.isSaaSAdmin, domain: siteOwner.domain }
    : customer ? { type: 'customer', name: customer.full_name, email: customer.email, isSaaSAdmin: false, domain: null } : null;

  const isLoadingAuth = siteOwnerLoading || !customerHasHydrated;
  
  const logout = async () => {
    if (currentUser?.type === 'admin') {
      await siteOwnerLogout();
      toast({ title: 'Logged Out' });
      router.push('/');
    } else if (currentUser?.type === 'customer') {
      customerLogout();
      toast({ title: 'Logged Out' });
      router.push('/login');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
        router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchOpen(false);
        setSearchQuery('');
    }
  }

  const NavLink = ({ href, label, className }: { href: string; label: string; className?: string; }) => {
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href) && href.length > 1;
    return (
      <Link
        href={href}
        className={cn(
          'text-base font-medium transition-all hover:text-primary',
          isActive ? 'text-primary font-bold' : 'text-foreground/70',
          className
        )}
      >
        {label}
      </Link>
    );
  };

  const HeaderLogo = () =>
    isSiteInfoLoading || !siteInfo ? (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
    ) : (
      <Link href="/" className="flex items-center gap-3 group">
        <div className={cn("p-2 rounded-xl flex items-center justify-center h-10 w-10 transition-transform group-hover:scale-110 shadow-sm", siteInfo.logoType === 'image' ? 'bg-background' : 'bg-primary')}>
          {siteInfo.logoType === 'image' && siteInfo.logoImageUrl ? (
            <div className="relative h-8 w-8">
              <Image src={siteInfo.logoImageUrl} alt={siteInfo.name} fill className="object-contain" />
            </div>
          ) : (
            <DynamicIcon name={siteInfo.logoIcon} className="h-6 w-6 text-primary-foreground" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black font-headline tracking-tighter text-foreground">{siteInfo.name}</span>
          {variant === 'v1' && <span className="text-[10px] text-muted-foreground hidden lg:block font-bold uppercase tracking-widest">{siteInfo.description?.slice(0, 30)}...</span>}
        </div>
      </Link>
    );
    
  if (isSearchOpen) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-20 items-center px-4 sm:px-6 lg:px-8 gap-2">
            <Button variant="ghost" size="icon" onClick={() => setSearchOpen(false)}>
                <ArrowLeft />
            </Button>
            <form onSubmit={handleSearchSubmit} className="flex-grow">
                <div className="relative">
                    <Input placeholder="Search for products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus className="w-full h-12 pl-4 rounded-xl border-2" />
                </div>
            </form>
        </div>
    </header>
    );
  }

  // --- V3: MINIMAL / TRANSPARENT ---
  if (variant === 'v3') {
      return (
        <header className={cn("sticky top-0 z-50 w-full border-b transition-all duration-300", scrolled ? "bg-background shadow-sm py-2" : "bg-transparent py-4 border-transparent")}>
            <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
                <HeaderLogo />
                <nav className="hidden md:flex items-center gap-10">
                    {navLinks.map(link => <NavLink key={link.id} {...link} className="text-sm font-bold uppercase tracking-widest" />)}
                </nav>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="rounded-full"><Search className="h-5 w-5" /></Button>
                    <ShoppingCart />
                    {currentUser ? (
                        <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href="/profile"><User className="h-5 w-5"/></Link></Button>
                    ) : (
                        <Button asChild size="sm" variant="outline" className="rounded-full px-6"><Link href="/login">Login</Link></Button>
                    )}
                </div>
            </div>
        </header>
      )
  }

  // --- V4: STICKY GLASS / FLOATING ---
  if (variant === 'v4' || variant === 'v2') {
    return (
        <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8">
            <div className={cn(
                "container mx-auto h-16 sm:h-20 bg-background/80 backdrop-blur-xl border-2 border-primary/10 shadow-xl flex items-center justify-between px-4 sm:px-8 transition-all duration-500",
                variant === 'v4' ? "rounded-full" : "rounded-[2rem]"
            )}>
                <div className="flex items-center gap-2 md:w-1/3">
                    <div className="md:hidden">
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><Menu /></Button></SheetTrigger>
                            <SheetContent side="left" className="rounded-r-[2rem]"><HeaderLogo /><nav className="mt-10 flex flex-col gap-4">{navLinks.map(l => <NavLink key={l.id} {...l} className="text-xl" />)}</nav></SheetContent>
                        </Sheet>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.slice(0, 2).map(link => <NavLink key={link.id} {...link} />)}
                    </nav>
                </div>

                <div className="flex justify-center flex-1 md:w-1/3">
                    <HeaderLogo />
                </div>

                <div className="flex items-center justify-end gap-2 md:w-1/3">
                    <nav className="hidden lg:flex items-center gap-6 mr-4">
                        {navLinks.slice(2).map(link => <NavLink key={link.id} {...link} />)}
                    </nav>
                    <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="rounded-full h-10 w-10"><Search className="h-5 w-5" /></Button>
                    <ShoppingCart />
                    {customer && <CustomerNotificationBell />}
                    <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
                    {isLoadingAuth ? <Skeleton className="h-10 w-10 rounded-full" /> : currentUser ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden"><Avatar className="h-10 w-10"><AvatarFallback>{currentUser.name?.charAt(0)}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>{currentUser.name}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link href="/profile">প্রোফাইল</Link></DropdownMenuItem><DropdownMenuItem onClick={logout}>লগ আউট</DropdownMenuItem></DropdownMenuContent>
                        </DropdownMenu>
                    ) : <Button asChild size="sm" className="rounded-full px-6 hidden sm:flex"><Link href="/login">লগইন</Link></Button>}
                </div>
            </div>
        </header>
    );
  }

  // V1 Layout: Standard
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <Link href="/" onClick={() => setIsSheetOpen(false)} className="mb-8">
                  <HeaderLogo />
                </Link>
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                        <Link
                        key={link.id}
                        href={link.href}
                        className={cn('text-lg font-medium text-foreground/80 transition-colors hover:text-foreground', pathname === link.href && 'text-primary font-bold')}
                        onClick={() => setIsSheetOpen(false)}
                        >
                        {link.label}
                        </Link>
                    )
                  )}
                </nav>
                <div className="mt-auto pt-6 border-t space-y-4">
                  <Button variant="ghost" className="w-full justify-start gap-3" onClick={toggleTheme}>
                    {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </Button>
                  {isLoadingAuth ? null : !currentUser ? (
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" asChild onClick={() => setIsSheetOpen(false)} className="rounded-xl"><Link href="/login">লগ ইন</Link></Button>
                        <Button asChild onClick={() => setIsSheetOpen(false)} className="rounded-xl"><Link href="/register">নিবন্ধন</Link></Button>
                    </div>
                  ) : null}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <HeaderLogo />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.id} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-10 w-10">
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="rounded-full h-10 w-10">
            <Search className="h-5 w-5" />
          </Button>
          <div className="hidden md:flex"><ShoppingCart /></div>
          {customer && <CustomerNotificationBell />}
          {isLoadingAuth ? <Skeleton className="h-10 w-10 rounded-full" /> : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary/20"><Avatar className="h-10 w-10"><AvatarFallback>{currentUser.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-bold leading-none">{currentUser.name}</p><p className="text-xs leading-none text-muted-foreground truncate">{currentUser.email}</p></div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/profile"><User className="mr-2 h-4 w-4" /> প্রোফাইল</Link></DropdownMenuItem>
                {currentUser.isSaaSAdmin ? <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /> SaaS ড্যাশবোর্ড</Link></DropdownMenuItem> : currentUser.domain && <DropdownMenuItem asChild><Link href="/admin"><LayoutDashboard className="mr-2 h-4 w-4" /> ড্যাশবোর্ড</Link></DropdownMenuItem>}
                <DropdownMenuSeparator /><DropdownMenuItem onClick={logout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" /> লগ আউট</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild className="rounded-full"><Link href="/login">লগ ইন</Link></Button>
              <Button asChild className="rounded-full px-6 shadow-md"><Link href="/register">নিবন্ধন</Link></Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
