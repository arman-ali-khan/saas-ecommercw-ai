
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
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

export default function CustomerNotificationsPage() {
  const { customer, _hasHydrated } = useCustomerAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchNotifications = useCallback(async () => {
    if (!customer) return;
    setIsLoading(true);
  
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', customer.id)
      .eq('recipient_type', 'customer')
      .eq('site_id', customer.site_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching notifications',
        description: error.message,
      });
    } else if (data) {
      setNotifications(data as Notification[]);
    }
    setIsLoading(false);
  }, [customer, toast]);



  useEffect(() => {
    if (_hasHydrated && customer) {
      fetchNotifications();
    } else if (_hasHydrated && !customer) {
      setIsLoading(false);
    }
  }, [customer, _hasHydrated, fetchNotifications]);

  useEffect(() => {
    if (!customer) return;

    const channel = supabase
      .channel(`customer-notifications-page-${customer.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${customer.id}&recipient_type=eq.customer&site_id=eq.${customer.site_id}`,
        },
        () => {
            fetchNotifications();
        }
      )
      .subscribe();
 
    return () => {
      supabase.removeChannel(channel);
    };
  }, [customer, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!customer) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('recipient_id', customer.id);
    // The real-time listener will trigger a refetch, no need to manually update state.
  };

  const handleMarkAllAsRead = async () => {
    if(!customer) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', customer.id)
      .eq('site_id', customer.site_id)
      .eq('is_read', false);
    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
    // The real-time listener will trigger a refetch.
  }

  if (isLoading) {
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
  console.log('customer',notifications)
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
