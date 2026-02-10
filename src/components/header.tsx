
'use client';

import Link from 'next/link';
import { Menu, User, LogOut, LayoutDashboard, Bell } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { Button } from './ui/button';
import ShoppingCart from './shopping-cart';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';
import { type Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import DynamicIcon from './dynamic-icon';
import Image from 'next/image';

function CustomerNotificationBell({
  customer,
  domain,
}: {
  customer: any;
  domain: string | null;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!customer) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', customer.id)
        .eq('recipient_type', 'customer')
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setNotifications(data);
        const unread = data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      }
    };

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', customer.id)
        .eq('recipient_type', 'customer')
        .eq('is_read', false);
      setUnreadCount(count || 0);
    };

    fetchNotifications();
    fetchUnreadCount();

    const channel = supabase
      .channel(`header-customer-notifications-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${customer.id}`,
        },
        (payload) => {
          setNotifications((prev) => [
            payload.new as Notification,
            ...prev.slice(0, 4),
          ]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${customer.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === payload.new.id ? (payload.new as Notification) : n
            )
          );
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer]);

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
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
            href={`/${domain}/profile/notifications`}
            className="justify-center cursor-pointer"
          >
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

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

  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    description: string | null;
    logoType: 'icon' | 'image';
    logoIcon: string;
    logoImageUrl: string | null;
  }>({ name: 'বাংলা ন্যাচারালস', description: '', logoType: 'icon', logoIcon: 'Leaf', logoImageUrl: null });
  const [isSiteInfoLoading, setIsSiteInfoLoading] = useState(true);

  // Create a unified user object for easier handling in the UI
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

  const isLoading = siteOwnerLoading || !customerHasHydrated;

  const segments = pathname.split('/').filter(Boolean);
  const KNOWN_ROOT_PATHS = [
    'admin',
    'login',
    'register',
    'profile',
    'get-started',
    'dashboard',
  ];
  const domain =
    segments.length > 0 && !KNOWN_ROOT_PATHS.includes(segments[0])
      ? segments[0]
      : siteOwner
        ? siteOwner.domain
        : null;
  const basePath = domain ? `/${domain}` : '';

  useEffect(() => {
    async function fetchInfo() {
      setIsSiteInfoLoading(true);
      if (domain) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, site_name, site_description')
          .eq('domain', domain)
          .single();
        if (profileData) {
          const { data: settingsData } = await supabase
            .from('store_settings')
            .select('logo_type, logo_icon, logo_image_url')
            .eq('site_id', profileData.id)
            .single();

          setSiteInfo({
            name: profileData.site_name || domain,
            description: profileData.site_description,
            logoType: settingsData?.logo_type || 'icon',
            logoIcon: settingsData?.logo_icon || 'Leaf',
            logoImageUrl: settingsData?.logo_image_url || null
          });
        } else {
          setSiteInfo({ name: domain, description: 'An e-commerce store', logoType: 'icon', logoIcon: 'Leaf', logoImageUrl: null });
        }
      } else {
        const { data } = await supabase
          .from('saas_settings')
          .select('platform_name, platform_description, logo_icon, logo_type, logo_image_url')
          .eq('id', 1)
          .single();
        if (data) {
          setSiteInfo({
            name: data.platform_name || 'বাংলা ন্যাচারালস',
            description: data.platform_description ||
              'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।',
            logoType: data.logo_type || 'icon',
            logoIcon: data.logo_icon || 'Leaf',
            logoImageUrl: data.logo_image_url || null,
          });
        } else {
          setSiteInfo({
            name: 'বাংলা ন্যাচারালস',
            description:
              'প্রাকৃতিক বাংলাদেশী পণ্যের জন্য একটি প্রাণবন্ত ই-কমার্স।',
            logoType: 'icon', 
            logoIcon: 'Leaf', 
            logoImageUrl: null 
          });
        }
      }
      setIsSiteInfoLoading(false);
    }
    fetchInfo();
  }, [domain]);

  const navLinks = [
    { href: basePath || '/', label: 'হোম' },
    { href: `${basePath}/products`, label: 'পণ্য' },
    { href: `${basePath}/about`, label: 'আমাদের সম্পর্কে' },
  ];

  if (currentUser?.isSaaSAdmin) {
    navLinks.push({ href: '/dashboard', label: 'SaaS Admin' });
  }

  const logout = async () => {
    if (currentUser?.type === 'admin') {
      await siteOwnerLogout();
      toast({ title: 'Logged Out' });
      router.push('/');
    } else if (currentUser?.type === 'customer') {
      customerLogout();
      toast({ title: 'Logged Out' });
      router.push(domain ? `/${domain}/login` : '/login');
    }
  };

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
      href === (basePath || '/')
        ? pathname === href
        : pathname.startsWith(href) && href.length > (basePath || '/').length;
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

  const AuthNavMobile = () => {
    if (isLoading) return null;
    if (currentUser) return null;
    return (
      <div className="border-t pt-6 mt-6 space-y-4">
        <SheetClose asChild>
          <Link
            href={domain ? `/${domain}/login` : '/login'}
            className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            লগ ইন
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Button asChild className="w-full">
            <Link href={domain ? `/${domain}/register` : '/get-started'}>
              সাইন আপ
            </Link>
          </Button>
        </SheetClose>
      </div>
    );
  };

  const HeaderLogo = () =>
    isSiteInfoLoading ? (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-3 w-[200px]" />
        </div>
      </div>
    ) : (
      <Link href={basePath || '/'} className="flex items-center gap-3">
        <div className="bg-primary p-2 rounded-full flex items-center justify-center h-10 w-10">
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="md:hidden">
          <Sheet>
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
              <SheetClose asChild>
                <div className="mb-8">
                  <HeaderLogo />
                </div>
              </SheetClose>
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <NavLink {...link} />
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto">
                <AuthNavMobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex">
          <HeaderLogo />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ShoppingCart />
          {customer && (
            <CustomerNotificationBell customer={customer} domain={domain} />
          )}
          {isLoading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
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
                  <Link
                    href={
                      currentUser.type === 'admin'
                        ? `/${currentUser.domain}/profile`
                        : `/${domain}/profile`
                    }
                  >
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
                      <Link href={`/${currentUser.domain}/admin`}>
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
                    <Link href={`/${domain}/login`}>লগ ইন</Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/${domain}/register`}>সাইন আপ করুন</Link>
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
