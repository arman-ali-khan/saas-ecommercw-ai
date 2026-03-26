'use client';

import Link from 'next/link';
import { Menu, LayoutDashboard, ChevronRight, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { Skeleton } from './ui/skeleton';
import { supabase } from '@/lib/supabase/client';
import { OptimizedImage as Image } from '@/components/ui/optimized-image';

import { usePathname } from 'next/navigation';
import { type SaasSettings } from '@/types';

interface SaasHeaderProps {
  initialSettings?: SaasSettings | null;
  lang?: 'en' | 'bn';
}

const translations = {
  bn: {
    features: 'ফিচারসমূহ',
    plans: 'প্ল্যান',
    reviews: 'রিভিউ',
    dashboard: 'SaaS ড্যাশবোর্ড',
    adminDashboard: 'ড্যাশবোর্ড',
    login: 'লগ ইন',
    getStarted: 'শুরু করুন',
    menu: 'মেনু',
    menuDesc: 'প্রধান নেভিগেশন মেনু',
    register: 'ফ্রি অ্যাকাউন্ট তৈরি করুন',
    enterDashboard: 'ড্যাশবোর্ডে প্রবেশ করুন'
  },
  en: {
    features: 'Features',
    plans: 'Pricing',
    reviews: 'Reviews',
    dashboard: 'SaaS Dashboard',
    adminDashboard: 'Dashboard',
    login: 'Log In',
    getStarted: 'Get Started',
    menu: 'Menu',
    menuDesc: 'Main navigation menu',
    register: 'Create Free Account',
    enterDashboard: 'Enter Dashboard'
  }
};

export default function SaasHeader({ initialSettings, lang = 'bn' }: SaasHeaderProps) {
  const user = useAuth((state) => state.user);
  const pathname = usePathname();
  const t = translations[lang];
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [siteInfo, setSiteInfo] = useState<{
    name: string;
    logoUrl: string | null;
  } | null>(initialSettings ? { 
    name: (lang === 'en' ? initialSettings.platform_name_en : initialSettings.platform_name) || initialSettings.platform_name, 
    logoUrl: initialSettings.logo_url 
  } : null);
  const [isLoading, setIsLoading] = useState(!initialSettings);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    setIsDark(document.documentElement.classList.contains('dark'));

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const fetchInfo = async () => {
      if (!initialSettings) {
        setIsLoading(true);
        try {
            const { data } = await supabase
              .from('saas_settings')
              .select('platform_name, platform_name_en, logo_url')
              .eq('id', 1)
              .single();
            
            if (data) {
              setSiteInfo({
                name: (lang === 'en' ? data.platform_name_en : data.platform_name) || data.platform_name || 'DokanBD',
                logoUrl: data.logo_url || null,
              });
            }
        } catch (e) {
            console.error("SaasHeader fetch error:", e);
        } finally {
            setIsLoading(false);
        }
      } else {
        setSiteInfo({
            name: (lang === 'en' ? initialSettings.platform_name_en : initialSettings.platform_name) || initialSettings.platform_name,
            logoUrl: initialSettings.logo_url
        });
      }
    };
    
    fetchInfo();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [initialSettings, lang]);

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

  const navLinks = [
    { href: '/#features', label: t.features },
    { href: '/#pricing', label: t.plans },
    { href: '/#testimonial', label: t.reviews },
  ];

  const HeaderLogo = () => (
    isLoading || !siteInfo ? (
      <Skeleton className="h-10 w-32 rounded-lg" />
    ) : (
      <Link href="/" className="flex items-center gap-2.5">
        {siteInfo.logoUrl ? (
            <div className="relative h-9 w-9">
              <Image src={siteInfo.logoUrl} alt={siteInfo.name} fill className="object-contain" />
            </div>
        ) : (
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center font-bold text-lg text-primary-foreground shadow-lg shadow-primary/20">
                {siteInfo.name.charAt(0)}
            </div>
        )}
        <span className="text-xl font-bold font-headline tracking-tight text-foreground">{siteInfo.name}</span>
      </Link>
    )
  );

  // Determine if we should be hidden based on path AND domain (Client-side)
  // This is a backup guard for SiteLayout
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname.toLowerCase();
        const base = (process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ihut.shop').toLowerCase();
        const isPlatformRoot = host === base || host === `www.${base}` || host === 'e-bd.shop' || host === 'www.e-bd.shop' || host.includes('localhost') || host.includes('cloudworkstations.dev');
        
        if (!isPlatformRoot && !pathname.startsWith('/dashboard') && !pathname.includes('/admin')) {
            // We are on a store domain but not in admin area, the header shouldn't even be here
            // SiteLayout usually handles this, but this is an extra layer.
        }
    }
  }, [pathname]);

  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    return null;
  }

  return (
    <header className={cn(
      "fixed top-0 z-50 w-full transition-all duration-300 px-4 md:px-0",
      scrolled 
        ? "py-3 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm" 
        : "py-6 bg-transparent"
    )}>
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8 bg-card/30 md:bg-transparent rounded-full border border-border/50 md:border-none backdrop-blur-sm md:backdrop-blur-none shadow-lg md:shadow-none">
        <HeaderLogo />

        <nav className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!isHydrated ? (
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-24 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full md:hidden" />
            </div>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full h-10 w-10">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Toggle Theme</span>
              </Button>

              {user?.isSaaSAdmin ? (
                <Button asChild className="rounded-full shadow-lg shadow-primary/10">
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t.dashboard}
                    </Link>
                  </Button>
              ) : user && user.domain ? (
                <Button asChild className="rounded-full shadow-lg shadow-primary/20">
                  <Link href={`/${user.domain}/admin`}>
                    {t.adminDashboard}
                  </Link>
                </Button>
              ) : (
                <div className="hidden md:flex items-center gap-3">
                  <Button variant="ghost" asChild className="rounded-full hover:bg-primary/10">
                    <Link href="/login">{t.login}</Link>
                  </Button>
                  <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20">
                    <Link href="/get-started">{t.getStarted}</Link>
                  </Button>
                </div>
              )}

              <div className="md:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-primary/10">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh] rounded-t-[2.5rem] border-t-2 border-primary/20 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
                    <div className="p-8 flex flex-col h-full">
                      <SheetHeader className="mb-10 text-left">
                        <SheetTitle className="text-3xl font-headline font-bold flex items-center gap-3">
                           <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-bold text-primary-foreground">
                              {siteInfo?.name.charAt(0) || 'S'}
                           </div>
                           {siteInfo?.name}
                        </SheetTitle>
                        <SheetDescription>{t.menuDesc}</SheetDescription>
                      </SheetHeader>
                      
                      <nav className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                            <SheetClose asChild key={link.href}>
                              <Link
                                href={link.href}
                                className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 text-xl font-medium transition-all active:scale-95"
                              >
                                {link.label}
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                              </Link>
                            </SheetClose>
                        ))}
                      </nav>

                      <div className="mt-auto space-y-4 pb-8">
                        {!user ? (
                          <>
                            <SheetClose asChild>
                              <Button asChild variant="outline" className="w-full h-14 rounded-2xl text-lg">
                                <Link href="/login">{t.login}</Link>
                              </Button>
                            </SheetClose>
                            <SheetClose asChild>
                              <Button asChild className="w-full h-14 rounded-2xl text-lg shadow-lg shadow-primary/20">
                                <Link href="/get-started">{t.register}</Link>
                              </Button>
                            </SheetClose>
                          </>
                        ) : (
                          <SheetClose asChild>
                            <Button asChild className="w-full h-14 rounded-2xl text-lg">
                              <Link href={user.isSaaSAdmin ? "/dashboard" : `/${user.domain}/admin`}>{t.enterDashboard}</Link>
                            </Button>
                          </SheetClose>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
