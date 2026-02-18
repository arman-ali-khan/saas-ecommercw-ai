
'use client';

import { Bell, Settings, LogOut, Wand2, User } from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminHeader() {
  const { user, logout: authLogout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/notifications/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: user.id,
          recipientType: 'admin',
          siteId: user.id,
          limit: 5
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.notifications?.filter((n: Notification) => !n.is_read).length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch admin notifications:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  const handleLogout = async () => {
    await authLogout();
    toast({ title: 'Logged Out' });
    router.push(`/admin/login`);
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id, recipientId: user.id }),
    });
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <div className="w-full flex-1">
        {/* You can add a breadcrumb or breadcrumb search here later */}
      </div>
      <div className="flex items-center gap-2">
        {/* Notification Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-0.5 -right-0.5 h-4 w-4 justify-center p-0 text-[10px] flex items-center">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="flex justify-between items-center">
                <span>Notifications</span>
                {unreadCount > 0 && <span className="text-[10px] text-muted-foreground">{unreadCount} unread</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} asChild>
                    <Link
                      href={n.link || '#'}
                      className={cn('cursor-pointer flex flex-col items-start gap-1 p-3 border-b last:border-0', !n.is_read && 'bg-primary/5')}
                      onClick={() => markAsRead(n.id)}
                    >
                      <p className={cn("text-sm leading-tight", !n.is_read && "font-bold")}>{n.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: bn })}
                      </p>
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  কোনো নতুন নোটিফিকেশন নেই।
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/notifications`} className="w-full justify-center cursor-pointer text-xs text-primary font-bold py-2">
                সব নোটিফিকেশন দেখুন
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border mx-1" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {user?.fullName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal p-4">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer py-2.5">
              <Link href={`/admin/settings`}>
                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Store Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer py-2.5">
              <Link href={`/admin/settings/ai`}>
                <Wand2 className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>AI Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer py-2.5">
              <LogOut className="mr-3 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
