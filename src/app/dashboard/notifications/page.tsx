
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
import { Loader2, Plus, ArrowRight, Search, X, CheckCircle2, Clock } from 'lucide-react';
import type { Notification } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/notifications/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipientType: 'admin', limit: 500 }),
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
            profiles: profilesMap.get(n.recipient_id) || null
        }));

        setNotifications(combinedData);

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
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

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
            <div>
            <CardTitle>Admin Notifications Tracking</CardTitle>
            <CardDescription>Monitor announcements sent to site admins and track if they have been dismissed.</CardDescription>
            </div>
            <Button asChild>
            <Link href="/dashboard/notifications/new">
                <Plus className="mr-2 h-4 w-4" /> Send Announcement
            </Link>
            </Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
            <div className="relative flex-grow max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, site, or message..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="read">Dismissed</SelectItem>
                    <SelectItem value="unread">Pending</SelectItem>
                </SelectContent>
            </Select>
            {(searchQuery || filterStatus !== 'all') && (
                <Button variant="ghost" onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}>
                    <X className="mr-2 h-4 w-4" /> Clear
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {paginatedNotifications.length > 0 ? (
          <>
            <div className="hidden md:block">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Admin & Site</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {paginatedNotifications.map((n) => (
                        <TableRow key={n.id}>
                        <TableCell>
                            <div className="font-bold">{n.profiles?.full_name || 'Deleted User'}</div>
                            <div className="text-xs text-muted-foreground">{n.profiles?.email}</div>
                            <div className="text-[10px] mt-1 bg-muted px-1.5 py-0.5 rounded w-fit">{n.profiles?.site_name} ({n.profiles?.domain})</div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2" title={n.message}>{n.message}</p>
                        </TableCell>
                        <TableCell className="text-xs">
                            {format(new Date(n.created_at), 'MMM d, p')}
                        </TableCell>
                        <TableCell>
                            {n.is_read ? (
                                <Badge variant="default" className="bg-green-500 hover:bg-green-600 gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Dismissed
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="gap-1">
                                    <Clock className="h-3 w-3" /> Pending
                                </Badge>
                            )}
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
            </div>
            
            <div className="grid gap-4 md:hidden">
                {paginatedNotifications.map((n) => (
                    <Card key={n.id} className={cn(n.is_read ? 'opacity-70' : 'border-primary/20')}>
                        <CardHeader className="p-4 pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-sm">{n.profiles?.full_name}</CardTitle>
                                    <CardDescription className="text-xs">{n.profiles?.site_name}</CardDescription>
                                </div>
                                {n.is_read ? (
                                    <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Dismissed</Badge>
                                ) : (
                                    <Badge variant="secondary">Pending</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                             <p className="text-sm italic mt-2 border-l-2 pl-3">"{n.message}"</p>
                             <div className="flex justify-between items-center mt-4">
                                <span className="text-[10px] text-muted-foreground">{n.profiles?.email}</span>
                                <span className="text-[10px] text-muted-foreground">{format(new Date(n.created_at), 'p, d MMM')}</span>
                             </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">
            <Search className="mx-auto h-10 w-10 mb-4 opacity-20" />
            <p>No matching tracking records found.</p>
          </div>
        )}
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="justify-center border-t py-4">
          <div className="flex items-center gap-4 text-sm">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <span className="text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
