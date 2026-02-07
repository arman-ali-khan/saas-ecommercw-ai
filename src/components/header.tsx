'use client';

import Link from 'next/link';
import { Menu, User, LogOut, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';

import Logo from './logo';
import { Button } from './ui/button';
import ShoppingCart from './shopping-cart';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
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
import { useAuth } from '@/context/auth-context';

export default function Header() {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  
  const segments = pathname.split('/').filter(Boolean);
  const KNOWN_ROOT_PATHS = ['admin', 'login', 'register', 'profile'];
  const username = segments.length > 0 && !KNOWN_ROOT_PATHS.includes(segments[0]) ? segments[0] : null;
  const basePath = username ? `/${username}` : '';

  const navLinks = [
    { href: basePath || '/', label: 'হোম' },
    { href: `${basePath}/products`, label: 'পণ্য' },
    { href: `${basePath}/about`, label: 'আমাদের সম্পর্কে' },
  ];
  
  if (user?.email === 'admin@example.com') {
      navLinks.push({ href: user ? `/admin/${user.id}`: '/login', label: 'অ্যাডমিন' });
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
    // Exact match for home, partial for others
    const isActive = href === (basePath || '/') ? pathname === href : pathname.startsWith(href);
    
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
      if (user) return null;
      return (
           <div className="border-t pt-6 mt-6 space-y-4">
             <SheetClose asChild>
                <Link href="/login" className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground">লগ ইন</Link>
             </SheetClose>
             <SheetClose asChild>
               <Button asChild className="w-full">
                 <Link href="/register">সাইন আপ</Link>
               </Button>
             </SheetClose>
           </div>
      )
  }

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
            <SheetContent side="left">
              <div className="flex flex-col p-6">
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
           {isLoading ? <div className="h-10 w-10"></div> :
            user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    <span>প্রোফাইল</span>
                  </Link>
                </DropdownMenuItem>
                {user.name && (
                   <DropdownMenuItem asChild>
                     <Link href={`/admin/${user.id}`}>
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
                <Link href="/register">সাইন আপ</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
