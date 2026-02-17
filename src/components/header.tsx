

'use client';

import Link from 'next/link';
import { Menu, User, LogOut, LayoutDashboard, Bell, Search, ArrowLeft } from 'lucide-react';
import { usePathname, useRouter, useParams } from 'next/navigation';

import { Button } from './ui/button';
import ShoppingCart from './shopping-cart';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
            const { notifications: data } = await response.json();
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

export default function Header({ siteInfo, navLinks, isLoading: isSiteInfoLoading }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { isSearchOpen, setSearchOpen } = useSearchStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const {
    user: siteOwner,
    loading: siteOwnerLoading,
    logout: siteOwnerLogout,
  } = useAuth();
  const {
    customer,
    customerLogout,
    _hasHydrated: customerHasHydrated,
  } = useCustomerAuth();

  const domain = params.username as string;

  const currentUser = siteOwner
    ? {
        type: 'admin',
        name: siteOwner.fullName,
        email: siteOwner.email,
        isSaaSAdmin: siteOwner.isSaaSAdmin,
        domain: siteOwner.domain,
      }
    : customer
      ? {
          type: 'customer',
          name: customer.full_name,
          email: customer.email,
          isSaaSAdmin: false,
          domain: null,
        }
      : null;

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

  const NavLink = ({
    href,
    label,
    className,
  }: {
    href: string;
    label: string;
    className?: string;
  }) => {
    const isActive =
      href === '/'
        ? pathname === '/'
        : pathname.startsWith(href) && href.length > 1;
    return (
      <Link
        href={href}
        className={cn(
          'text-lg font-medium text-foreground/80 transition-colors hover:text-foreground',
          isActive && 'text-primary font-semibold',
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
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-3 w-[200px]" />
        </div>
      </div>
    ) : (
      <Link href="/" className="flex items-center gap-3">
        <div className={`${siteInfo.logoType === 'image' ? '':'bg-primary'} p-2 rounded-full flex items-center justify-center h-10 w-10`}>
          {siteInfo.logoType === 'image' && siteInfo.logoImageUrl ? (
            <div className="relative h-8 w-8">
              <Image src={siteInfo.logoImageUrl} alt={siteInfo.name} fill className="object-contain rounded-sm" />
            </div>
          ) : (
            <DynamicIcon name={siteInfo.logoIcon} className="h-6 w-6 text-primary-foreground" />
          )}
        </div>
        <div>
          <div className="text-lg font-bold font-headline">{siteInfo.name}</div>
          <p className="text-xs text-muted-foreground hidden lg:block max-w-xs truncate">
            {siteInfo.description}
          </p>
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search for products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full h-10 pl-10"
                    />
                </div>
            </form>
        </div>
    </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">মেনু খুলুন</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <SheetHeader>
                  <SheetTitle className="sr-only">Main Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main navigation menu
                  </SheetDescription>
                </SheetHeader>
                <Link href="/" onClick={() => setIsSheetOpen(false)} className="mb-8">
                  <HeaderLogo />
                </Link>
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => {
                    const isActive = (link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)) && link.href.length > 1;
                    return (
                        <Link
                        key={link.id}
                        href={link.href}
                        className={cn(
                            'text-lg font-medium text-foreground/80 transition-colors hover:text-foreground',
                            isActive && 'text-primary font-semibold'
                        )}
                        onClick={() => setIsSheetOpen(false)}
                        >
                        {link.label}
                        </Link>
                    )
                  })}
                </nav>
                <div className="mt-auto pt-6 border-t space-y-4">
                  {isLoadingAuth ? null : !currentUser ? (
                    <div className="space-y-4">
                        <Link href={'/login'} className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground" onClick={() => setIsSheetOpen(false)}>
                            লগ ইন
                        </Link>
                        <Button asChild className="w-full" onClick={() => setIsSheetOpen(false)}>
                            <Link href={`/register`}>
                                সাইন আপ করুন
                            </Link>
                        </Button>
                    </div>
                  ) : null}
                   <Button variant="outline" className="w-full" onClick={() => setIsSheetOpen(false)}>Close Menu</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <HeaderLogo />
          </div>
        </div>


        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.id} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-6 w-6" />
            <span className="sr-only">Search</span>
          </Button>
          <div className="hidden md:flex">
            <ShoppingCart />
          </div>
          {customer && (
            <div>
              <CustomerNotificationBell />
            </div>
          )}
          {isLoadingAuth ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {currentUser.name?.charAt(0).toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {currentUser.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    <span>প্রোফাইল</span>
                  </Link>
                </DropdownMenuItem>
                {currentUser.isSaaSAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>SaaS Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  currentUser.domain && (
                    <DropdownMenuItem asChild>
                      <Link href={`/admin`}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>ড্যাশবোর্ড</span>
                      </Link>
                    </DropdownMenuItem>
                  )
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>লগ আউট</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              {domain ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href={`/login`}>লগ ইন</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/register`}>সাইন আপ করুন</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login">লগ ইন</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/get-started">শুরু করুন</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
