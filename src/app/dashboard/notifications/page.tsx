
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
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
import { Loader2, Plus, Search, X, CheckCircle2, Clock, Bell, ShoppingCart, MessageSquare, Globe, Sparkles, Filter, Store } from 'lucide-react';
import type { Notification } from '@/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/stores/auth';

type NotificationWithDetails = Notification & {
  profiles?: {
    full_name: string;
    username: string;
    email: string;
    site_name: string;
    domain: string;
  } | null;
};

const NOTIFICATIONS_PER_PAGE = 15;

export default function SaasNotificationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/notifications/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                recipientType: 'admin', 
                limit: 200,
                platformView: true // Requesting all notifications for SaaS admin
            }),
        });
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);

        const notificationsData = result.notifications || [];

        // Fetch profiles via our secure API to ensure decryption
        const profileRes = await fetch('/api/saas/admins/list');
        const profileResult = await profileRes.json();
        
        if (!profileRes.ok) throw new Error(profileResult.error);
        const profiles = profileResult.users || [];
        const profilesMap = new Map(profiles.map((p: any) => [p.id, p]));

        const combinedData = notificationsData.map((n: any) => ({
            ...n,
            profiles: profilesMap.get(n.recipient_id || n.site_id) || null
        }));

        setNotifications(combinedData);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.isSaaSAdmin) {
        fetchNotifications();
    }
  }, [fetchNotifications, user]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
        const statusMatch = filterStatus === 'all' || (filterStatus === 'read' && n.is_read) || (filterStatus === 'unread' && !n.is_read);
        const searchMatch = searchQuery === '' ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.profiles?.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return statusMatch && searchMatch;
    });
  }, [notifications, searchQuery, filterStatus]);

  const totalPages = Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * NOTIFICATIONS_PER_PAGE,
    currentPage * NOTIFICATIONS_PER_PAGE
  );

  const getIcon = (message: string) => {
      const msg = message.toLowerCase();
      if (msg.includes('অর্ডার') || msg.includes('order')) return <ShoppingCart className="h-5 w-5 text-blue-500" />;
      if (msg.includes('টিকেট') || msg.includes('ticket') || msg.includes('support')) return <MessageSquare className="h-5 w-5 text-amber-500" />;
      if (msg.includes('domain') || msg.includes('ডোমেইন')) return <Globe className="h-5 w-5 text-purple-500" />;
      if (msg.includes('seo') || msg.includes('এসইও')) return <Sparkles className="h-5 w-5 text-green-500" />;
      return <Bell className="h-5 w-5 text-primary" />;
  }

  const markAsRead = async (id: string) => {
    try {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        const response = await fetch('/api/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id }),
        });
        if (!response.ok) throw new Error('Update failed');
    } catch (e) {
        console.error(e);
    }
  }

  if (isLoading) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-3">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Notifications</h1>
            <p className="text-muted-foreground mt-1">Track all activities, requests, and system alerts across the platform.</p>
          </div>
          <Button asChild className="rounded-full shadow-lg shadow-primary/20">
            <Link href="/dashboard/notifications/new">
                <Plus className="mr-2 h-4 w-4" /> Send Announcement
            </Link>
          </Button>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4">
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by store, admin, or message..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl"
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-44 h-11 rounded-xl">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="unread">Pending</SelectItem>
                        <SelectItem value="read">Dismissed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedNotifications.length > 0 ? (
            <div className="divide-y border-t">
                {paginatedNotifications.map((n) => (
                    <div
                        key={n.id}
                        className={cn(
                            "group p-4 flex items-start gap-4 transition-all hover:bg-muted/30 relative",
                            !n.is_read ? "bg-primary/[0.02]" : "opacity-70"
                        )}
                    >
                        {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                        
                        <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-2",
                            !n.is_read ? "bg-primary/10 border-primary/20" : "bg-muted border-transparent"
                        )}>
                            {getIcon(n.message)}
                        </div>

                        <div className="flex-grow min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className={cn("text-sm sm:text-base leading-snug", !n.is_read ? "font-bold text-foreground" : "font-medium")}>
                                    {n.message}
                                </p>
                                {!n.is_read && <Badge variant="default" className="h-4 px-1.5 text-[8px] font-black">NEW</Badge>}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 font-bold">
                                    <Clock className="h-3 w-3" /> {format(new Date(n.created_at), 'PPPp', { locale: bn })}
                                </span>
                                {n.profiles ? (
                                    <span className="flex items-center gap-1 font-bold uppercase tracking-wider text-primary">
                                        <Store className="h-3 w-3" /> {n.profiles.site_name} (@{n.profiles.domain})
                                    </span>
                                ) : n.recipient_id ? (
                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">User ID: {n.recipient_id.slice(0,8)}</span>
                                ) : (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">System Alert</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {n.link && (
                                <Button variant="outline" size="sm" asChild className="h-8 text-xs rounded-full">
                                    <Link href={n.link} onClick={() => !n.is_read && markAsRead(n.id)}>View Details</Link>
                                </Button>
                            )}
                            {!n.is_read && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => markAsRead(n.id)}>
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-green-500" />
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-24 text-muted-foreground flex flex-col items-center">
              <Bell className="mx-auto h-16 w-16 mb-4 opacity-10" />
              <p className="text-lg font-medium">No activity notifications found.</p>
              <p className="text-sm">Try changing your filters or search terms.</p>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="justify-center border-t py-6 bg-muted/10">
                <div className="flex items-center gap-4 text-sm">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
                    <span className="text-muted-foreground font-bold">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
