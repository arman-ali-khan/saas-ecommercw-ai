'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileClock,
  CreditCard,
  FileText,
  MessageSquare,
  Settings,
  Bot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './logo';

const adminNavLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/uncompleted', label: 'Uncompleted', icon: FileClock },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/pages', label: 'Page Manager', icon: FileText },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/live-questions', label: 'Live Questions', icon: Bot },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

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
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground'
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <div className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <Link href="/admin">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {adminNavLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
