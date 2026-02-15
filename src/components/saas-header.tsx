
'use client';

import Link from 'next/link';
import { Menu, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { Skeleton } from './ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import Image from 'next/image';

const navLinks = [
  { href: '#features', label: 'বৈশিষ্ট্য' },
  { href: '#pricing', label: 'মূল্য' },
  { href: '#testimonial', label: 'প্রশংসাপত্র' },
];

export default function SaasHeader() {
  const user = useAuth((state) => state.user);
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    logoUrl: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  useEffect(() => {
    setIsHydrated(true);

    const fetchInfo = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('saas_settings')
        .select('platform_name, logo_url')
        .eq('id', 1)
        .single();
      
      if (data) {
        setSiteInfo({
          name: data.platform_name || 'Your SaaS',
          logoUrl: data.logo_url || null,
        });
      } else {
        setSiteInfo({
          name: 'Your SaaS',
          logoUrl: null,
        })
      }
      setIsLoading(false);
    };
    fetchInfo();
  }, []);

  const NavLink = ({
    href,
    label,
    className,
    onClick,
  }: {
    href: string;
    label: string;
    className?: string;
    onClick?: () => void;
  }) => {
    return (
      <Link
        href={href}
        className={cn(
          'text-sm font-medium text-foreground/80 transition-colors hover:text-foreground',
          className
        )}
        onClick={onClick}
      >
        {label}
      </Link>
    );
  };
  
  const HeaderLogo = () => {
    if (isLoading || !siteInfo) {
      return (
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
      );
    }

    return (
      <Link href="/" className="flex items-center gap-3">
        {siteInfo.logoUrl ? (
            <div className="relative h-10 w-10">
              <Image src={siteInfo.logoUrl} alt={siteInfo.name} fill className="object-contain" />
            </div>
        ) : (
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center font-bold text-lg">
                {siteInfo.name.charAt(0)}
            </div>
        )}
        <span className="text-xl font-bold font-headline">{siteInfo.name}</span>
      </Link>
    );
  };
  
  const AuthNavMobile = () => {
    if (!isHydrated) return null;
    
    if (user?.isSaaSAdmin) {
        return (
            <div className="border-t pt-6 mt-6 space-y-4">
                <Button asChild className="w-full" onClick={() => setIsSheetOpen(false)}>
                    <Link href="/dashboard">SaaS Dashboard</Link>
                </Button>
            </div>
        )
    }

    if (user && user.domain) {
      return (
        <div className="border-t pt-6 mt-6 space-y-4">
          <Button asChild className="w-full" onClick={() => setIsSheetOpen(false)}>
            <Link href={`/${user.domain}/admin`}>ড্যাশবোর্ড</Link>
          </Button>
        </div>
      );
    }
    return (
      <div className="border-t pt-6 mt-6 space-y-4">
        <Link
            href="/login"
            className="block text-lg font-medium text-foreground/80 transition-colors hover:text-foreground"
            onClick={() => setIsSheetOpen(false)}
          >
            লগ ইন
        </Link>
        <Button asChild className="w-full" onClick={() => setIsSheetOpen(false)}>
          <Link href="/get-started">শুরু করুন</Link>
        </Button>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
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
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Site navigation
                  </SheetDescription>
                </SheetHeader>
                <Link href="/" className="mb-8" onClick={() => setIsSheetOpen(false)}>
                  <HeaderLogo />
                </Link>
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                      <NavLink {...link} className="text-lg" onClick={() => setIsSheetOpen(false)} key={link.href}/>
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
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {!isHydrated ? (
            <Skeleton className="h-10 w-24" />
          ) : user?.isSaaSAdmin ? (
             <Button asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  SaaS Dashboard
                </Link>
              </Button>
          ) : user && user.domain ? (
            <Button asChild>
              <Link href={`/${user.domain}/admin`}>
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
                <Link href="/get-started">শুরু করুন</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
