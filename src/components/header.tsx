'use client';

import Link from 'next/link';
import { Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import Logo from './logo';
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

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const { user: siteOwner, loading: siteOwnerLoading, logout: siteOwnerLogout } = useAuth();
  const { customer, customerLogout, _hasHydrated: customerHasHydrated } = useCustomerAuth();

  // Create a unified user object for easier handling in the UI
  const currentUser = siteOwner ? {
    type: 'admin',
    name: siteOwner.fullName,
    email: siteOwner.email,
    isSaaSAdmin: siteOwner.isSaaSAdmin,
    domain: siteOwner.domain,
  } : customer ? {
    type: 'customer',
    name: customer.full_name,
    email: customer.email,
    isSaaSAdmin: false,
    domain: null,
  } : null;

  const isLoading = siteOwnerLoading || !customerHasHydrated;

  const segments = pathname.split('/').filter(Boolean);
  const KNOWN_ROOT_PATHS = ['admin', 'login', 'register', 'profile', 'get-started', 'dashboard'];
  const domain = segments.length > 0 && !KNOWN_ROOT_PATHS.includes(segments[0]) ? segments[0] : (siteOwner ? siteOwner.domain : null);
  const basePath = domain ? `/${domain}` : '';

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
    const isActive = href === (basePath || '/') ? pathname === href : pathname.startsWith(href) && href.length > (basePath || '/').length;
    return (
      <Link href={href} className={cn('text-lg font-medium text-foreground/80 transition-colors hover:text-foreground', isActive && 'text-primary font-semibold', className)}>
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
          <Link href={domain ? `/${domain}/login` : '/login'} className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground">
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
                <SheetDescription className="sr-only">Main navigation menu</SheetDescription>
              </SheetHeader>
              <SheetClose asChild>
                <Link href={basePath || '/'} className="mb-8">
                  <Logo />
                </Link>
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
          <Link href={basePath || '/'}>
            <Logo />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ShoppingCart />
          {isLoading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{currentUser.name?.charAt(0).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={currentUser.type === 'admin' ? `/${currentUser.domain}/profile` : `/${domain}/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    <span>প্রোফাইল</span>
                  </Link>
                </DropdownMenuItem>
                {currentUser.isSaaSAdmin ? (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" /><span>SaaS Dashboard</span></Link>
                  </DropdownMenuItem>
                ) : (
                  currentUser.domain && (
                    <DropdownMenuItem asChild>
                      <Link href={`/${currentUser.domain}/admin`}><LayoutDashboard className="mr-2 h-4 w-4" /><span>ড্যাশবোর্ড</span></Link>
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
                  <Button variant="ghost" asChild><Link href={`/${domain}/login`}>লগ ইন</Link></Button>
                  <Button asChild><Link href={`/${domain}/register`}>সাইন আপ করুন</Link></Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild><Link href="/login">লগ ইন</Link></Button>
                  <Button asChild><Link href="/get-started">সাইন আপ করুন</Link></Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
