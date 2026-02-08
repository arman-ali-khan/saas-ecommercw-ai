'use client';

import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageSquare,
  PanelLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import AdminMobileSidebar from './admin-mobile-sidebar';

export default function AdminBottomNav({ username }: { username: string }) {
  const pathname = usePathname();

  const navLinks = [
    {
      href: `/${username}/admin/orders`,
      label: 'Orders',
      icon: ShoppingBag,
      count: 5, // Mock count
    },
    {
      href: `/${username}/admin/products`,
      label: 'Products',
      icon: Package,
    },
    {
      href: `/${username}/admin/live-questions`,
      label: 'Chat',
      icon: MessageSquare,
      count: 2, // Mock count
    },
    {
      href: `/${username}/admin`,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="admin-bottom-nav md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-sidebar-border z-50 p-1">
      <div className="grid h-16 grid-cols-5 gap-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="flex flex-col h-auto items-center justify-center p-1 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <PanelLeft className="h-5 w-5" />
              <span className="text-xs font-normal">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
            <SheetHeader>
              <SheetTitle className="sr-only">Admin Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Admin navigation menu
              </SheetDescription>
            </SheetHeader>
            <AdminMobileSidebar username={username} />
          </SheetContent>
        </Sheet>

        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  'flex flex-col h-full items-center justify-center p-1 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'text-sidebar-primary bg-sidebar-accent'
                )}
              >
                <div className="relative">
                  <link.icon className="h-5 w-5" />
                  {link.count && (
                    <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                      {link.count}
                    </span>
                  )}
                </div>
                <span className="text-xs font-normal">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
