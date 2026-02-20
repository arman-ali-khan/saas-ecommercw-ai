
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BellOff, CheckCheck, Eye, X, MessageSquare, ShoppingCart, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 10;

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const getIcon = (message: string) => {
      if (message.includes('অর্ডার')) return <ShoppingCart className="h-5 w-5 text-primary" />;
      if (message.includes('প্রশ্ন') || message.includes('রিভিউ')) return <MessageSquare className="h-5 w-5 text-primary" />;
      return <Bell className="h-5 w-5 text-primary" />;
  }

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(() => {
    return notifications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [notifications, currentPage]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>অ্যাক্টিভিটি নোটিফিকেশন</CardTitle>
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
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-0 gap-4">
        <div>
            <CardTitle className="text-2xl font-bold">নোটিফিকেশন হিস্ট্রি</CardTitle>
            <CardDescription>অর্ডার, রিভিউ এবং অন্যান্য আপডেটের ইতিহাস।</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={notifications.every(n => n.is_read)} className="rounded-full">
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border/50">
            <BellOff className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p className="text-muted-foreground">আপনার কোনো নোটিফিকেশন নেই।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'relative flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 group',
                  notification.is_read ? 'bg-background/50 border-border/50 text-muted-foreground opacity-70' : 'bg-card border-primary/20 shadow-sm hover:border-primary/40'
                )}
              >
                {notification.link ? (
                    <Link 
                        href={notification.link} 
                        className="absolute inset-0 z-10" 
                        onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    />
                ) : null}
                
                <div className={cn(
                    'h-10 w-10 shrink-0 rounded-full flex items-center justify-center bg-primary/10',
                    !notification.is_read && 'ring-2 ring-primary/20'
                )}>
                    {getIcon(notification.message)}
                </div>
                <div className="flex-grow min-w-0">
                  <p className={cn("text-sm sm:text-base leading-snug truncate", !notification.is_read ? "font-bold text-foreground" : "font-medium")}>
                    {notification.message}
                  </p>
                  <p className="text-[10px] sm:text-xs mt-1 uppercase tracking-wider font-semibold opacity-60">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: bn })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0 relative z-20">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                          e.preventDefault();
                          handleMarkAsRead(notification.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-center gap-4 px-0 pt-6">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                আগেরটি
            </Button>
            <div className="text-sm font-medium">
                পৃষ্ঠা {currentPage} / {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
            >
                পরবর্তী
                <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
