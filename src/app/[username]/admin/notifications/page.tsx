
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BellOff, CheckCheck, Eye } from 'lucide-react';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    try {
        const response = await fetch('/api/notifications/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipientId: user.id,
                recipientType: 'admin',
                siteId: user.id
            }),
        });
        const result = await response.json();
        if (response.ok) {
            setNotifications(result.notifications || []);
        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching notifications',
        description: error.message,
      });
    } finally {
        setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    }
  }, [user, authLoading, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
        setNotifications((prev) =>
            prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        const response = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId, recipientId: user?.id }),
        });
        if (!response.ok) throw new Error('Failed to update');
        toast({ title: 'নোটিফিকেশনটি Dismiss করা হয়েছে।' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        fetchNotifications();
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if(!user) return;
    try {
        setNotifications(prev => prev.map(n => ({...n, is_read: true})));
        const response = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientId: user.id, all: true }),
        });
        if (!response.ok) throw new Error('Failed to update');
        toast({ title: 'সকল নোটিফিকেশন Dismiss করা হয়েছে।' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        fetchNotifications();
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>নোটিফিকেশন</CardTitle>
          <CardDescription>আপনার সাইটের সকল নোটিফিকেশন এখানে দেখুন।</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="flex flex-row items-center justify-between px-0">
        <div>
            <CardTitle className="text-2xl">নোটিফিকেশন</CardTitle>
            <CardDescription>আপনার সাইটের সকল আপডেট এখানে পাবেন।</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.is_read)} className="rounded-full">
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed">
            <BellOff className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p className="text-muted-foreground">আপনার কোনো নোটিফিকেশন নেই।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-5 rounded-xl border transition-all duration-200',
                  notification.is_read ? 'bg-background/50 border-border/50 text-muted-foreground opacity-70' : 'bg-card border-primary/20 shadow-sm'
                )}
              >
                <div className={cn(
                    'mt-1.5 h-3 w-3 shrink-0 rounded-full',
                    !notification.is_read ? 'bg-primary animate-pulse' : 'bg-muted'
                )}></div>
                <div className="flex-grow">
                  <p className={cn("text-sm sm:text-base leading-relaxed", !notification.is_read ? "font-bold text-foreground" : "font-medium")}>
                    {notification.message}
                  </p>
                  <p className="text-[10px] sm:text-xs mt-2 uppercase tracking-wider font-semibold opacity-60">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: bn })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {notification.link && (
                    <Button asChild variant="secondary" size="sm" className="h-8 rounded-lg">
                      <Link href={notification.link} onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}>
                        <Eye className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">দেখুন</span>
                      </Link>
                    </Button>
                  )}
                  {!notification.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-lg border-primary/20 hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <X className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Dismiss</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
