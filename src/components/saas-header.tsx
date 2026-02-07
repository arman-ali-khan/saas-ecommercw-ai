'use client';

import Link from 'next/link';
import { Menu, LayoutDashboard } from 'lucide-react';

import Logo from './logo';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

const navLinks = [
  { href: '#features', label: 'বৈশিষ্ট্য' },
  { href: '#pricing', label: 'মূল্য' },
  { href: '#testimonial', label: 'প্রশংসাপত্র' },
];

export default function SaasHeader() {
  const { user, isLoading } = useAuth();

  const NavLink = ({
    href,
    label,
    className,
  }: {
    href: string;
    label: string;
    className?: string;
  }) => {
    return (
      <Link
        href={href}
        className={cn(
          'text-sm font-medium text-foreground/80 transition-colors hover:text-foreground',
          className
        )}
      >
        {label}
      </Link>
    );
  };
  
  const AuthNavMobile = () => {
      if (isLoading) return null;
      if (user && user.name) {
        return (
          <div className="border-t pt-6 mt-6 space-y-4">
            <SheetClose asChild>
              <Button asChild className="w-full">
                <Link href={`/${user.name}/admin`}>ড্যাশবোর্ড</Link>
              </Button>
            </SheetClose>
          </div>
        )
      };
      return (
           <div className="border-t pt-6 mt-6 space-y-4">
             <SheetClose asChild>
                <Link href="/login" className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground">লগ ইন</Link>
             </SheetClose>
             <SheetClose asChild>
               <Button asChild className="w-full">
                 <Link href="/register">সাইন আপ করুন</Link>
               </Button>
             </SheetClose>
           </div>
      )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
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
                    <Link href="/" className="mb-8">
                      <Logo />
                    </Link>
                  </SheetClose>
                  <nav className="flex flex-col gap-6">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.href}>
                        <NavLink {...link} className="text-lg"/>
                      </SheetClose>
                    ))}
                  </nav>
                  <AuthNavMobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden md:flex">
            <Link href="/">
              <Logo />
            </Link>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
           {isLoading ? <div className="h-10 w-10"></div> :
            user && user.name ? (
            <Button asChild>
              <Link href={`/${user.name}/admin`}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                ড্যাশবোর্ড
              </Link>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">লগ ইন</Link>
              </Button>
              <Button asChild>
                <Link href="/register">সাইন আপ করুন</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
