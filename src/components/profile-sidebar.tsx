'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  MapPin,
  Settings,
  User,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';

export default function ProfileSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading || !user || user.domain !== username) {
    // Skeleton can be shown by parent layout
    return null;
  }

  const navLinks = [
    { href: `/${username}/profile`, label: 'ড্যাশবোর্ড', icon: User },
    { href: `/${username}/profile/orders`, label: 'আমার অর্ডার', icon: ShoppingBag },
    { href: `/${username}/profile/reviews`, label: 'আমার রিভিউ', icon: Star },
    { href: `/${username}/profile/addresses`, label: 'ঠিকানা বই', icon: MapPin },
    { href: `/${username}/profile/settings`, label: 'অ্যাকাউন্ট সেটিংস', icon: Settings },
  ];

  const NavLink = ({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
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
