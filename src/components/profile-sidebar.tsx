
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  MapPin,
  Settings,
  User,
  Star,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';

export default function ProfileSidebar() {
  const pathname = usePathname();
  const { customer:user, loading: customerLoading } = useCustomerAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/get-customer-notification-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: user.id, siteId: user.site_id }),
      });
      if (response.ok) {
        const { count } = await response.json();
        setUnreadCount(count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notification count:", error);
    }
  }, [user]);

  useEffect(() => {
    if (!customerLoading && user) {
        fetchCount();
    }
  }, [user, customerLoading, fetchCount]);

  if (customerLoading || !user) {
    return null;
  }
  
  const navLinks = [
    { href: `/profile`, label: 'ড্যাশবোর্ড', icon: User },
    { href: `/profile/notifications`, label: 'নোটিফিকেশন', icon: Bell, count: unreadCount },
    { href: `/profile/orders`, label: 'আমার অর্ডার', icon: ShoppingBag },
    // { href: `/profile/reviews`, label: 'আমার রিভিউ', icon: Star },
    { href: `/profile/addresses`, label: 'ঠিকানা বই', icon: MapPin },
    { href: `/profile/settings`, label: 'অ্যাকাউন্ট সেটিংস', icon: Settings },
  ];

  const NavLink = ({
    href,
    label,
    icon: Icon,
    count,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
    count?: number;
  }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-foreground/80 transition-all hover:bg-muted hover:text-foreground',
          isActive && 'bg-muted font-semibold text-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
        {count && count > 0 ? (
          <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">{count}</Badge>
        ) : null}
      </Link>
    );
  };

  return (
    <aside>
      <nav className="grid items-start text-sm font-medium gap-1">
        {navLinks.map((link) => (
          <NavLink key={link.href} {...link} />
        ))}
      </nav>
    </aside>
  );
}
