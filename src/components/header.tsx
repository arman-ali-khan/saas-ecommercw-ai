'use client';

import Link from 'next/link';
import { Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: logoutAction } = useAuth();
  const { toast } = useToast();
  
  const [isHydrated, setIsHydrated] = useState(false);
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const KNOWN_ROOT_PATHS = [
    'admin',
    'login',
    'register',
    'profile',
    'get-started',
  ];
  const domain =
    segments.length > 0 && !KNOWN_ROOT_PATHS.includes(segments[0])
      ? segments[0]
      : user
        ? user.domain
        : null;
  const basePath = domain ? `/${domain}` : '';

  const navLinks = [
    { href: basePath || '/', label: 'হোম' },
    { href: `${basePath}/products`, label: 'পণ্য' },
    { href: `${basePath}/about`, label: 'আমাদের সম্পর্কে' },
  ];

  if (user?.email === 'admin@example.com' && user?.domain) {
    navLinks.push({ href: `/${user.domain}/admin`, label: 'অ্যাডমিন' });
  }

  const logout = () => {
    logoutAction();
    toast({ title: 'লগ আউট', description: "আপনি সফলভাবে লগ আউট হয়েছেন।" });
    router.push('/');
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
    // Exact match for home, partial for others.
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
    if (!isHydrated) return null;
    if (user) return null;
    return (
      <div className="border-t pt-6 mt-6 space-y-4">
        <SheetClose asChild>
          <Link
            href="/login"
            className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            লগ ইন
          </Link>
        </SheetClose>
        <SheetClose asChild>
          <Button asChild className="w-full">
            <Link href="/get-started">সাইন আপ</Link>
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
                <SheetDescription className="sr-only">
                  Main navigation menu
                </SheetDescription>
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
          {!isHydrated ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {user.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/${user.domain}/profile`}>
                    <User className="mr-2 h-4 w-4" />
                    <span>প্রোফাইল</span>
                  </Link>
                </DropdownMenuItem>
                {user.domain && (
                  <DropdownMenuItem asChild>
                    <Link href={`/${user.domain}/admin`}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>ড্যাশবোর্ড</span>
                    </Link>
                  </DropdownMenuItem>
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
              <Button variant="ghost" asChild>
                <Link href="/login">লগ ইন</Link>
              </Button>
              <Button asChild>
                <Link href="/get-started">সাইন আপ করুন</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
