
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
import { Loader2, Plus, Search, X, CheckCircle2, Clock, Bell, ShoppingCart, MessageSquare, Globe, Sparkles, Filter, Store, UserCheck, Send } from 'lucide-react';
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
  const [filterType, setFilterType] = useState<'all' | 'sent' | 'received'>('all');
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
                platformView: true
            }),
        });
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);

        const notificationsData = result.notifications || [];

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
  }, [searchQuery, filterType]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
        // Sent means a specific recipient_id is set
        // Received/System Request means recipient_id is NULL
        const typeMatch = filterType === 'all' || 
                         (filterType === 'sent' && n.recipient_id !== null) || 
                         (filterType === 'received' && n.recipient_id === null);

        const searchMatch = searchQuery === '' ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.profiles?.site_name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        return typeMatch && searchMatch;
    });
  }, [notifications, searchQuery, filterType]);

  const totalPages = Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * NOTIFICATIONS_PER_PAGE,
    currentPage * NOTIFICATIONS_PER_PAGE
  );

  const getIcon = (n: Notification) => {
      if (n.recipient_id !== null) return <Send className="h-5 w-5 text-blue-500" />;
      const msg = n.message.toLowerCase();
      if (msg.includes('অর্ডার') || msg.includes('order')) return <ShoppingCart className="h-5 w-5 text-green-500" />;
      if (msg.includes('টিকেট') || msg.includes('ticket')) return <MessageSquare className="h-5 w-5 text-amber-500" />;
      if (msg.includes('domain') || msg.includes('ডোমেইন')) return <Globe className="h-5 w-5 text-purple-500" />;
      if (msg.includes('account') || msg.includes('অ্যাকাউন্ট')) return <UserCheck className="h-5 w-5 text-primary" />;
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
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activity & Announcements</h1>
            <p className="text-muted-foreground mt-1">Monitor platform alerts and track sent announcement status.</p>
          </div>
          <Button asChild className="rounded-full shadow-lg">
            <Link href="/dashboard/notifications/new">
                <Plus className="mr-2 h-4 w-4" /> Send New Announcement
            </Link>
          </Button>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="pb-4 border-b bg-muted/10">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search stores or messages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 rounded-xl"
                    />
                </div>
                <div className="flex bg-muted p-1 rounded-xl">
                    <Button 
                        variant={filterType === 'all' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilterType('all')}
                        className="rounded-lg h-9"
                    >All</Button>
                    <Button 
                        variant={filterType === 'received' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilterType('received')}
                        className="rounded-lg h-9"
                    >Requests</Button>
                    <Button 
                        variant={filterType === 'sent' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilterType('sent')}
                        className="rounded-lg h-9"
                    >Sent (Tracking)</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedNotifications.length > 0 ? (
            <div className="divide-y">
                {paginatedNotifications.map((n) => (
                    <div
                        key={n.id}
                        className={cn(
                            "group p-4 flex items-start gap-4 transition-all hover:bg-muted/30 relative",
                            !n.is_read && n.recipient_id === null ? "bg-primary/[0.03]" : ""
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border-2",
                            n.recipient_id !== null ? "bg-blue-500/10 border-blue-200" : "bg-primary/10 border-primary/20"
                        )}>
                            {getIcon(n)}
                        </div>

                        <div className="flex-grow min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <p className={cn("text-sm sm:text-base leading-snug", !n.is_read && n.recipient_id === null ? "font-bold text-foreground" : "font-medium")}>
                                    {n.message}
                                </p>
                                {n.recipient_id !== null && (
                                    <Badge variant={n.is_read ? 'default' : 'outline'} className={cn("text-[8px] h-4 uppercase", n.is_read ? "bg-green-500 hover:bg-green-600" : "")}>
                                        {n.is_read ? 'READ BY STORE' : 'SENT / UNREAD'}
                                    </Badge>
                                )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                                <span className="flex items-center gap-1 font-bold">
                                    <Clock className="h-3 w-3" /> {format(new Date(n.created_at), 'PPPp', { locale: bn })}
                                </span>
                                {n.profiles && (
                                    <span className="flex items-center gap-1 font-bold text-primary">
                                        <Store className="h-3 w-3" /> {n.profiles.site_name} (@{n.profiles.domain})
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {n.link && (
                                <Button variant="outline" size="sm" asChild className="h-8 text-xs rounded-full">
                                    <Link href={n.link} onClick={() => !n.is_read && n.recipient_id === null && markAsRead(n.id)}>Open</Link>
                                </Button>
                            )}
                            {n.recipient_id === null && !n.is_read && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => markAsRead(n.id)}>
                                    <X className="h-4 w-4" />
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
