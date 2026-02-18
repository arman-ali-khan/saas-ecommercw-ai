
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, ArrowRight, Search, X } from 'lucide-react';
import type { Notification } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type NotificationWithRecipient = Notification & {
  profiles: {
    full_name: string;
    username: string;
  } | null;
};

const NOTIFICATIONS_PER_PAGE = 10;

export default function SaasNotificationsPage() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationWithRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'admin', 'customer'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'read', 'unread'
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
        // Fetch using service role admin client directly for SaaS admin since they see everything
        const { data: notificationsData, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false });

        if (notificationsError) throw notificationsError;

        if (!notificationsData || notificationsData.length === 0) {
            setNotifications([]);
            setIsLoading(false);
            return;
        }

        // Manually join profiles for the list
        const adminRecipientIds = [...new Set(notificationsData.filter(n => n.recipient_type === 'admin').map(n => n.recipient_id))];
        const customerRecipientIds = [...new Set(notificationsData.filter(n => n.recipient_type === 'customer').map(n => n.recipient_id))];

        const adminProfilesPromise = adminRecipientIds.length > 0 
            ? supabase.from('profiles').select('id, full_name, username').in('id', adminRecipientIds)
            : Promise.resolve({ data: [] });

        const customerProfilesPromise = customerRecipientIds.length > 0
            ? supabase.from('customer_profiles').select('id, full_name, email').in('id', customerRecipientIds)
            : Promise.resolve({ data: [] });
        
        const [adminProfilesRes, customerProfilesRes] = await Promise.all([adminProfilesPromise, customerProfilesPromise]);

        const profilesMap = new Map((adminProfilesRes.data || []).map((p: any) => [p.id, p]));
        const customerProfilesMap = new Map((customerProfilesRes.data || []).map((p: any) => [p.id, { full_name: p.full_name, username: p.email.split('@')[0] }]));

        const combinedData = notificationsData.map(notification => {
            const profileInfo = notification.recipient_type === 'admin' 
                ? profilesMap.get(notification.recipient_id) 
                : customerProfilesMap.get(notification.recipient_id);
            return {
                ...notification,
                profiles: profileInfo || null,
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
  
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType, filterStatus]);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const typeMatch = filterType === 'all' || n.recipient_type === filterType;
            const statusMatch = filterStatus === 'all' || (filterStatus === 'read' && n.is_read) || (filterStatus === 'unread' && !n.is_read);
            const searchMatch = searchQuery === '' ||
                n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase());
            
            return typeMatch && statusMatch && searchMatch;
        });
    }, [notifications, searchQuery, filterType, filterStatus]);

    const totalPages = Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE);
    const paginatedNotifications = filteredNotifications.slice(
        (currentPage - 1) * NOTIFICATIONS_PER_PAGE,
        currentPage * NOTIFICATIONS_PER_PAGE
    );

    const clearFilters = () => {
        setSearchQuery('');
        setFilterType('all');
        setFilterStatus('all');
    };

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
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
            <CardTitle>Platform Notifications</CardTitle>
            <CardDescription>View all notifications sent to users and admins.</CardDescription>
            </div>
            <Button asChild>
            <Link href="/dashboard/notifications/new">
                <Plus className="mr-2 h-4 w-4" /> Create Notification
            </Link>
            </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search notifications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
            </Select>
            <Button variant="ghost" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" /> Clear Filters
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {paginatedNotifications.length > 0 ? (
          <>
            {/* Desktop View */}
            <div className="hidden md:block">
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
                    {paginatedNotifications.map((notification) => (
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
            </div>
            
            {/* Mobile View */}
            <div className="grid gap-4 md:hidden">
                {paginatedNotifications.map((notification) => (
                    <Card key={notification.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{notification.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-base">{notification.profiles?.full_name || 'N/A'}</CardTitle>
                                        <CardDescription>@{notification.profiles?.username || 'unknown'}</CardDescription>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                     <Badge variant={notification.is_read ? 'outline' : 'default'}>
                                        {notification.is_read ? 'Read' : 'Unread'}
                                    </Badge>
                                    <Badge variant={getRecipientTypeBadgeVariant(notification.recipient_type)}>{notification.recipient_type}</Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground">{notification.message}</p>
                             <p className="text-xs text-muted-foreground mt-2">{format(new Date(notification.created_at), 'PPp')}</p>
                        </CardContent>
                        {notification.link && (
                            <CardContent>
                                <Button asChild variant="outline" size="sm" className="w-full">
                                    <a href={notification.link} target="_blank" rel="noopener noreferrer">
                                        View <ArrowRight className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">No notifications found matching your criteria.</p>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="justify-center pt-6">
          <div className="flex items-center gap-4 text-sm">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
