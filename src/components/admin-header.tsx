'use client';

import { Bell, Settings, LogOut, HelpCircle, Home, Loader2 } from 'lucide-react';
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
import { supabase } from '@/lib/supabase/client';

export default function AdminHeader() {
  const { user, logout: authLogout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotificationsData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const listResponse = await fetch('/api/notifications/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: user.id,
          recipientType: 'admin',
          siteId: user.id,
          limit: 5
        }),
      });
      const listResult = await listResponse.json();
      if (listResponse.ok) {
        setNotifications(listResult.notifications || []);
      }

      const countResponse = await fetch('/api/admin/dashboard-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: user.id }),
      });
      const countResult = await countResponse.json();
      if (countResponse.ok && countResult.counts) {
        setUnreadCount(countResult.counts.unreadNotifications);
      }
    } catch (error) {
      console.error("Failed to fetch admin notifications:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      fetchNotificationsData();

      const channel = supabase
        .channel(`admin-header-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications(prev => [newNotif, ...prev].slice(0, 5));
            setUnreadCount(prev => prev + 1);
            toast({ 
                title: 'নতুন নোটিফিকেশন', 
                description: newNotif.message,
                duration: 5000 
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, fetchNotificationsData, toast]);

  const handleLogout = async () => {
    await authLogout();
    toast({ title: 'Logged Out' });
    router.push(`/admin/login`);
  };

  const markAsRead = async (id: string) => {
    if (!user) return;
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    const wasUnread = notifications.find(n => n.id === id && !n.is_read);
    if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));

    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id, recipientId: user.id }),
    });
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur px-2 sm:px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
      <div className="flex-1 flex items-center gap-2">
        <Button variant="outline" size="sm" asChild className="h-9 px-3 gap-2">
            <Link href="/">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">স্টোর দেখুন</span>
            </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild className="h-9 px-3 gap-2">
            <Link href="/admin/support">
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">সাপোর্ট</span>
            </Link>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-[10px] flex items-center border-2 border-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel className="flex justify-between items-center py-3">
                <span>নোটিফিকেশন</span>
                {unreadCount > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {unreadCount} নতুন
                    </span>
                )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[350px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} asChild>
                    <Link
                      href={n.link || '#'}
                      className={cn(
                        'cursor-pointer flex flex-col items-start gap-1 p-4 border-b last:border-0 transition-colors',
                        !n.is_read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      <p className={cn("text-sm leading-tight text-foreground", !n.is_read && "font-bold")}>
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: bn })}
                      </p>
                    </Link>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  কোনো নোটিফিকেশন পাওয়া যায়নি।
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/notifications`} className="w-full justify-center cursor-pointer text-xs text-primary font-bold py-3 hover:bg-primary/5">
                সকল নোটিফিকেশন দেখুন
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-6 w-px bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 overflow-hidden ring-offset-background transition-all hover:ring-2 hover:ring-primary/20">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
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
                <span>স্টোর সেটিংস</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer py-2.5">
              <Link href={`/admin/support`}>
                <HelpCircle className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>সাপোর্ট টিকেট</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/5 cursor-pointer py-2.5">
              <LogOut className="mr-3 h-4 w-4" />
              <span>লগ আউট</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}