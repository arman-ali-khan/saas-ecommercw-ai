'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ArrowRight } from 'lucide-react';
import type { Notification } from '@/types';

type NotificationWithRecipient = Notification & {
  profiles: {
    full_name: string;
    username: string;
  } | null;
};

export default function SaasNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationWithRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
        const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (notificationsError) {
            throw notificationsError;
        }

        if (!notificationsData || notificationsData.length === 0) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        const adminRecipientIds = notificationsData
            .filter(n => n.recipient_type === 'admin')
            .map(n => n.recipient_id);
        
        const customerRecipientIds = notificationsData
            .filter(n => n.recipient_type === 'customer')
            .map(n => n.recipient_id);

        const profilesPromise = adminRecipientIds.length > 0 
            ? supabase.from('profiles').select('id, full_name, username').in('id', adminRecipientIds)
            : Promise.resolve({ data: [], error: null });

        const customerProfilesPromise = customerRecipientIds.length > 0
            ? supabase.from('customer_profiles').select('id, full_name, email').in('id', customerRecipientIds)
            : Promise.resolve({ data: [], error: null });
        
        const [
            { data: profilesData, error: profilesError },
            { data: customerProfilesData, error: customerProfilesError }
        ] = await Promise.all([profilesPromise, customerProfilesPromise]);

        if (profilesError) throw profilesError;
        if (customerProfilesError) throw customerProfilesError;

        const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
        const customerProfilesMap = new Map((customerProfilesData || []).map(p => [p.id, { ...p, username: p.email.split('@')[0] }]));

        const combinedData = notificationsData.map(notification => {
            let profileInfo = null;
            if (notification.recipient_type === 'admin') {
                profileInfo = profilesMap.get(notification.recipient_id) || null;
            } else {
                profileInfo = customerProfilesMap.get(notification.recipient_id) || null;
            }
            return {
                ...notification,
                profiles: profileInfo,
            };
        });

        setNotifications(combinedData as NotificationWithRecipient[]);

    } catch (error: any) {
        toast({
            variant: 'destructive',
            title: 'Error fetching notifications',
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
    const getRecipientTypeBadgeVariant = (type: string): "default" | "secondary" | "outline" | "destructive" => {
        return type === 'admin' ? 'secondary' : 'outline';
    };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Platform Notifications</CardTitle>
          <CardDescription>Loading all notifications sent across the platform...</CardDescription>
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
          <CardTitle>Platform Notifications</CardTitle>
          <CardDescription>View all notifications sent to users and admins.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/dashboard/notifications/new">
            <Plus className="mr-2 h-4 w-4" /> Create Notification
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {notifications.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>
                    <div className="font-medium">{notification.profiles?.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">@{notification.profiles?.username || 'unknown'}</div>
                    <Badge variant={getRecipientTypeBadgeVariant(notification.recipient_type)} className="mt-1">{notification.recipient_type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-sm truncate">{notification.message}</TableCell>
                  <TableCell>
                    <Badge variant={notification.is_read ? 'outline' : 'default'}>
                      {notification.is_read ? 'Read' : 'Unread'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(notification.created_at), 'PPp')}</TableCell>
                  <TableCell className="text-right">
                    {notification.link && (
                        <Button asChild variant="ghost" size="sm">
                            <a href={notification.link} target="_blank" rel="noopener noreferrer">
                                View <ArrowRight className="ml-2 h-4 w-4" />
                            </a>
                        </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-8">No notifications found.</p>
        )}
      </CardContent>
    </Card>
  );
}
