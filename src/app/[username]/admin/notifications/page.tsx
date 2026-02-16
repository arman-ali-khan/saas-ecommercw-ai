
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
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
import { Loader2, BellOff } from 'lucide-react';
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

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', user.id)
      .eq('recipient_type', 'admin')
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
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchNotifications();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    }
  };
  
  const handleMarkAllAsRead = async () => {
    if(!user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (error) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } else {
        setNotifications(prev => prev.map(n => ({...n, is_read: true})));
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>View all your site notifications.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>View all your site notifications.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>Mark all as read</Button>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BellOff className="mx-auto h-12 w-12 mb-4" />
            <p>You have no notifications.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border transition-colors',
                  notification.is_read ? 'bg-transparent text-muted-foreground' : 'bg-muted/50'
                )}
              >
                <div className={cn(
                    'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                    !notification.is_read && 'bg-primary'
                )}></div>
                <div className="flex-grow">
                  <p className="font-medium text-foreground">{notification.message}</p>
                  <p className="text-xs mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: bn })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {notification.link ? (
                    <Button asChild variant="secondary" size="sm">
                      <Link href={notification.link} onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}>View</Link>
                    </Button>
                  ) : !notification.is_read ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark as Read
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
