'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  PanelLeft, 
  Shapes, 
  Globe, 
  Store, 
  Settings,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import SaasAdminSidebar from './saas-admin-sidebar';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

export default function SaasBottomNav() {
  const pathname = usePathname();
  const [siteInfo, setSiteInfo] = useState<{ name: string; logoUrl: string | null } | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'settings' }),
        });
        const result = await response.json();
        if (response.ok && result.data) {
            setSiteInfo({
                name: result.data.platform_name || 'SaaS Admin',
                logoUrl: result.data.logo_url || null,
            });
        }
      } catch (e) { console.error(e); }
    };
    fetchInfo();
  }, []);

  const navLinks = [
    { href: '/dashboard/plans', label: 'Plans', icon: Shapes },
    { href: '/dashboard/custom-domains', label: 'Domains', icon: Globe },
    { href: '/dashboard/users', label: 'Stores', icon: Store },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border z-50 p-1 safe-area-pb">
      <div className="grid h-16 grid-cols-5 gap-1 max-w-md mx-auto">
        {/* Sidebar Drawer Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col h-full items-center justify-center p-1 text-muted-foreground hover:text-primary transition-all active:scale-90"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0 flex flex-col">
            <SheetHeader className="p-6 border-b border-sidebar-border bg-sidebar shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {siteInfo?.logoUrl ? (
                            <div className="relative h-8 w-8">
                                <Image src={siteInfo.logoUrl} alt="Logo" fill className="object-contain" />
                            </div>
                        ) : (
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground">
                                {siteInfo?.name?.charAt(0) || 'S'}
                            </div>
                        )}
                        <SheetTitle className="text-lg font-black text-sidebar-foreground truncate max-w-[120px]">
                            {siteInfo?.name || 'SaaS Admin'}
                        </SheetTitle>
                    </div>
                    <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <X className="h-4 w-4" />
                        </Button>
                    </SheetClose>
                </div>
            </SheetHeader>
            <div className="flex-grow overflow-y-auto">
                <SaasAdminSidebar isMobile />
            </div>
          </SheetContent>
        </Sheet>

        {/* Action Links */}
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className="flex-1">
              <div
                className={cn(
                  'flex flex-col h-full items-center justify-center p-1 rounded-xl text-muted-foreground transition-all active:scale-90',
                  isActive && 'text-primary bg-primary/5'
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive && "animate-in zoom-in duration-300")} />
                <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
