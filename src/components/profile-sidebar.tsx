
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
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from './ui/badge';

export default function ProfileSidebar() {
  const pathname = usePathname();
  const { customer:user, _hasHydrated } = useCustomerAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', user.id)
            .eq('recipient_type', 'customer')
            .eq('is_read', false);
        setUnreadCount(count || 0);
    };
    fetchCount();

    const channel = supabase
        .channel(`profile-sidebar-notifications-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}`}, fetchCount)
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [user]);

  if (!_hasHydrated || !user) {
    return null;
  }

  const username = pathname.split('/')[1];
  
  const navLinks = [
    { href: `/${username}/profile`, label: 'ড্যাশবোর্ড', icon: User },
    { href: `/${username}/profile/notifications`, label: 'নোটিফিকেশন', icon: Bell, count: unreadCount },
    { href: `/${username}/profile/orders`, label: 'আমার অর্ডার', icon: ShoppingBag },
    { href: `/${username}/profile/reviews`, label: 'আমার রিভিউ', icon: Star },
    { href: `/${username}/profile/addresses`, label: 'ঠিকানা বই', icon: MapPin },
    { href: `/${username}/profile/settings`, label: 'অ্যাকাউন্ট সেটিংস', icon: Settings },
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
