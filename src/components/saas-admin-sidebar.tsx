'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  CreditCard,
  Building,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/stores/auth';
import { SheetClose } from './ui/sheet';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface SaasAdminSidebarProps {
    isMobile?: boolean;
}

export default function SaasAdminSidebar({ isMobile = false }: SaasAdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout: logoutAction } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  if (!user || !user.isSaaSAdmin) {
    return null; // Or a loading skeleton
  }

  const logout = () => {
    logoutAction();
    toast({ title: 'Logged Out' });
    router.push('/');
  }

  const adminNavLinks = [
    { href: `/dashboard`, label: 'Dashboard', icon: Home },
    { href: `/dashboard/users`, label: 'Users', icon: Users },
    { href: `/dashboard/subscriptions`, label: 'Subscriptions', icon: CreditCard },
    { href: `/`, label: 'View Landing Page', icon: Building },
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
    const linkComponent = (
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

    if (isMobile) {
      return <SheetClose asChild>{linkComponent}</SheetClose>;
    }
    
    return linkComponent;
  };
  
  const SidebarContent = () => (
    <div className="flex h-full max-h-screen flex-col gap-2 text-sidebar-foreground bg-sidebar">
      {!isMobile && (
        <div className="flex h-20 items-center border-b border-sidebar-border px-6">
          <Link href={`/dashboard`}>
            <span className="text-xl font-bold font-headline">SaaS Admin</span>
          </Link>
        </div>
      )}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-4 text-sm font-medium">
          {adminNavLinks.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className='flex-1'>
                <p className="font-semibold text-sm">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button onClick={logout} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
      </div>
    </div>
  );

  if (isMobile) {
    return <SidebarContent />;
  }

  return (
    <div className="hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:block">
      <SidebarContent />
    </div>
  );
}
