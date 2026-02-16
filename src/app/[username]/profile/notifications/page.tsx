
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
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
import { Loader2, BellOff } from 'lucide-react';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';


export default function CustomerNotificationsPage() {
  const { customer, loading: customerLoading } = useCustomerAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/get-customer-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, siteId: customer.site_id }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const { notifications: data } = await response.json();
      setNotifications(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error fetching notifications',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [customer, toast]);



  useEffect(() => {
    if (!customerLoading && customer) {
      fetchNotifications();
    } else if (!customerLoading && !customer) {
      setIsLoading(false);
    }
  }, [customer, customerLoading, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!customer) return;
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    await fetch('/api/mark-notification-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, customerId: customer.id }),
    });
  };

  const handleMarkAllAsRead = async () => {
    if(!customer) return;
    setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    const response = await fetch('/api/mark-all-notifications-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: customer.id, siteId: customer.site_id }),
    });
    if (!response.ok) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark all as read.' });
        fetchNotifications();
    }
  }

  if (isLoading || customerLoading) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">আমার নোটিফিকেশন</h1>
                    <p className="text-muted-foreground">আপনার অর্ডার এবং অ্যাকাউন্টের আপডেট এখানে দেখুন।</p>
                </div>
            </div>
            <Card>
                <CardContent className="flex items-center justify-center py-16">
                    <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold">আমার নোটিফিকেশন</h1>
            <p className="text-muted-foreground">আপনার অর্ডার এবং অ্যাকাউন্টের আপডেট এখানে দেখুন।</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>সবগুলো পঠিত হিসেবে চিহ্নিত করুন</Button>
      </div>
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BellOff className="mx-auto h-12 w-12 mb-4" />
              <p>আপনার কোনো নোটিফিকেশন নেই।</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors',
                     notification.is_read ? 'text-muted-foreground' : 'font-semibold'
                  )}
                >
                  <div className={cn(
                      'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                      !notification.is_read && 'bg-primary'
                  )}></div>
                  <div className="flex-grow">
                    <p className={cn(!notification.is_read && 'text-foreground')}>{notification.message}</p>
                    <p className="text-xs mt-1 text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: bn })}
                    </p>
                  </div>
                  {notification.link ? (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={notification.link} onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}>দেখুন</Link>
                    </Button>
                  ) : !notification.is_read ? (
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                        পঠিত
                    </Button>
                  ) : null }
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
