'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
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
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;

export default function AdminNotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const { notifications, setNotifications, lastFetched } = useAdminStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(() => {
    const store = useAdminStore.getState();
    return store.notifications.length === 0;
  });
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNotifications = useCallback(async (force = false) => {
    if (!user) return;
    
    const store = useAdminStore.getState();
    const isFresh = Date.now() - store.lastFetched.notifications < 300000; // 5 mins cache
    
    if (!force && store.notifications.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    if (store.notifications.length === 0 || force) {
        setIsLoading(true);
    }

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
      if (useAdminStore.getState().notifications.length === 0) {
          toast({
            variant: 'destructive',
            title: 'Error fetching notifications',
            description: error.message,
          });
      }
    } finally {
        setIsLoading(false);
    }
  }, [user, setNotifications, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    }
  }, [user, authLoading, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
        const updatedNotifications = notifications.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n));
        setNotifications(updatedNotifications);
        
        const response = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId, recipientId: user?.id }),
        });
        if (!response.ok) throw new Error('Failed to update');
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        fetchNotifications(true);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if(!user) return;
    try {
        setNotifications(notifications.map(n => ({...n, is_read: true})));
        const response = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientId: user.id, all: true }),
        });
        if (!response.ok) throw new Error('Failed to update');
        toast({ title: 'সকল নোটিফিকেশন Dismiss করা হয়েছে।' });
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
        fetchNotifications(true);
    }
  }

  const getIcon = (message: string) => {
      if (message.includes('অর্ডার')) return <ShoppingCart className="h-5 w-5 text-primary" />;
      if (message.includes('প্রশ্ন') || message.includes('রিভিউ') || message.includes('সাপোর্ট')) return <MessageSquare className="h-5 w-5 text-primary" />;
      return <Bell className="h-5 w-5 text-primary" />;
  }

  const totalPages = Math.ceil(notifications.length / ITEMS_PER_PAGE);
  const paginatedNotifications = useMemo(() => {
    return notifications.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [notifications, currentPage]);

  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground animate-pulse">লোড হচ্ছে...</p>
        </div>
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 w-full bg-muted animate-pulse rounded-xl" />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">অ্যাক্টিভিটি নোটিফিকেশন</h1>
            <p className="text-sm text-muted-foreground mt-1">আপনার সাইটের সকল আপডেটের ইতিহাস এখানে দেখুন।</p>
        </div>
        <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead} 
            disabled={notifications.every(n => n.is_read)} 
            className="rounded-full h-10 px-4 shadow-sm"
        >
            <CheckCheck className="mr-2 h-4 w-4" /> 
            <span className="hidden xs:inline">Mark all read</span>
            <span className="xs:hidden">All Read</span>
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-24 bg-card rounded-[2rem] border border-dashed border-border/50 flex flex-col items-center">
            <div className="h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <BellOff className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">আপনার কোনো নোটিফিকেশন নেই।</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
                {paginatedNotifications.map((notification) => (
                <div
                    key={notification.id}
                    className={cn(
                    'relative flex items-start sm:items-center gap-3 sm:gap-4 p-4 rounded-2xl border transition-all duration-300 group overflow-hidden',
                    notification.is_read 
                        ? 'bg-background/40 border-border/40 text-muted-foreground opacity-80' 
                        : 'bg-card border-primary/20 shadow-sm hover:shadow-md hover:border-primary/40 ring-1 ring-primary/5'
                    )}
                >
                    {notification.link && (
                        <Link 
                            href={notification.link} 
                            className="absolute inset-0 z-10" 
                            onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                        />
                    )}
                    
                    <div className={cn(
                        'h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-full flex items-center justify-center transition-all duration-300',
                        notification.is_read ? 'bg-muted/50' : 'bg-primary/10 ring-4 ring-primary/5'
                    )}>
                        {getIcon(notification.message)}
                    </div>

                    <div className="flex-grow min-w-0 py-0.5">
                        <p className={cn(
                            "text-sm sm:text-base leading-snug break-words", 
                            !notification.is_read ? "font-bold text-foreground" : "font-medium"
                        )}>
                            {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold opacity-60 flex items-center">
                                <ClockIcon className="inline-block h-3 w-3 mr-1" />
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: bn })}
                            </span>
                            {!notification.is_read && (
                                <Badge variant="default" className="h-4 px-1.5 text-[8px] sm:text-[10px] font-black uppercase">NEW</Badge>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0 relative z-20 self-start sm:self-center">
                    {!notification.is_read && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
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

            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t">
                    <div className="flex items-center gap-2 order-2 sm:order-1">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-10 w-10 p-0"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="bg-muted/50 px-4 h-10 flex items-center rounded-xl text-sm font-bold border">
                            পৃষ্ঠা {currentPage} / {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl h-10 w-10 p-0"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const ClockIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);