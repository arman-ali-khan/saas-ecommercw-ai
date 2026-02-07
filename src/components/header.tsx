'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';

import Logo from './logo';
import { Button } from './ui/button';
import ShoppingCart from './shopping-cart';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About Us' },
  { href: '/admin', label: 'Admin' },
];

export default function Header() {
  const pathname = usePathname();

  const NavLink = ({
    href,
    label,
    className,
  }: {
    href: string;
    label: string;
    className?: string;
  }) => {
    const isActive = pathname === href;
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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col p-6">
                <Link href="/" className="mb-8">
                  <Logo />
                </Link>
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <NavLink {...link} />
                    </SheetClose>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex">
          <Link href="/">
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
        </div>
      </div>
    </header>
  );
}
