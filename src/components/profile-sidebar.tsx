'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  ShoppingBag,
  MapPin,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

export default function ProfileSidebar({ userID }: { userID: string }) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user || user.id !== userID) {
    return null;
  }

  const navLinks = [
    { href: `/profile/${user.id}`, label: 'ড্যাশবোর্ড', icon: User },
    { href: `/admin/${user.id}/products`, label: 'পণ্য পরিচালনা', icon: Package },
    { href: `/admin/${user.id}/orders`, label: 'অর্ডার পরিচালনা', icon: ShoppingBag },
    { href: `/profile/${user.id}/addresses`, label: 'ঠিকানা বই', icon: MapPin },
    { href: `/profile/${user.id}/settings`, label: 'অ্যাকাউন্ট সেটিংস', icon: Settings },
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
