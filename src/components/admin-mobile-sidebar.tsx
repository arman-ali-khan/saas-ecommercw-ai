'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Star,
  LayoutList,
  Home,
  Tags,
  Users,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Logo from './logo';
import { useAuth } from '@/stores/auth';
import { SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export default function AdminMobileSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading, logout: authLogout } = useAuth();
  
  if (loading || !user) {
    return null;
  }

  const handleLogout = async () => {
    await authLogout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push(`/${username}/admin/login`);
  }

  const adminNavLinks = [
    { href: `/${username}`, label: 'View Store', icon: Home },
    { href: `/${username}/admin`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `/${username}/admin/products`, label: 'Products', icon: Package },
    { href: `/${username}/admin/categories`, label: 'Categories', icon: Tags },
    { href: `/${username}/admin/orders`, label: 'Orders', icon: ShoppingBag },
    { href: `/${username}/admin/customers`, label: 'Customers', icon: Users },
    { href: `/${username}/admin/featured-products`, label: 'Featured Products', icon: Star },
    { href: `/${username}/admin/section-manager`, label: 'Section Manager', icon: LayoutList },
    { href: `/${username}/admin/uncompleted`, label: 'Uncompleted', icon: FileClock },
    { href: `/${username}/admin/payments`, label: 'Payments', icon: CreditCard },
    { href: `/${username}/admin/pages`, label: 'Page Manager', icon: FileText },
    { href: `/${username}/admin/reviews`, label: 'Reviews', icon: MessageSquare },
    { href: `/${username}/admin/live-questions`, label: 'Live Questions', icon: Bot },
    { href: `/${username}/admin/settings`, label: 'Settings', icon: Settings },
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
        <SheetClose asChild>
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
      </SheetClose>
    );
  };

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 text-sidebar-foreground bg-sidebar">
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <SheetClose asChild>
            <Link href={`/${username}/admin`}>
                <Logo />
            </Link>
          </SheetClose>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {adminNavLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-sidebar-border">
          <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
  );
}
