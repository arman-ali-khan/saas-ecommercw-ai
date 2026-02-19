'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { type SeoRequest } from '@/types';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/stores/auth';

export default function SeoRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SeoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SeoRequest | null>(null);
  const { toast } = useToast();
  
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'seo_requests' }),
        });
        const result = await response.json();
        if (response.ok) {
            setRequests(result.data as SeoRequest[]);
        } else {
            throw new Error(result.error || 'Failed to fetch SEO requests');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching requests', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [fetchRequests, user]);
  
  const handleMarkAsComplete = async () => {
    if (!selectedRequest) return;
    setIsActionLoading(true);
    try {
        const response = await fetch('/api/saas/seo-requests/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedRequest.id, status: 'completed' }),
        });
        if (response.ok) {
            toast({ title: 'Request marked as complete!' });
            await fetchRequests();
            setSelectedRequest(null);
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to update status');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsActionLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" => {
    return status === 'completed' ? 'default' : 'secondary';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>SEO Review Requests</CardTitle>
          <CardDescription>Review and manage SEO requests from site owners.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No SEO requests found.</p>
            </div>
          ) : (
             <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Product Count</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {requests.map((req) => (
                        <TableRow key={req.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                            <Avatar><AvatarFallback>{req.user_name.charAt(0)}</AvatarFallback></Avatar>
                            <div>
                                <div className="font-medium text-sm">{req.user_name}</div>
                                <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{req.user_email}</div>
                            </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="font-medium text-sm">{req.site_name}</div>
                            <div className="text-[10px] text-muted-foreground">{req.site_domain}</div>
                        </TableCell>
                        <TableCell className="text-sm font-bold">{req.product_count}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'PP')}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusBadgeVariant(req.status)} className="text-[10px] h-5">
                            {req.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(req)} className="h-8 text-xs">
                                Review
                            </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
             </div>
          )}
        </CardContent>
      </Card>
      
      {/* Custom Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isActionLoading && setSelectedRequest(null)} />
            <div className="relative w-full max-w-lg bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold">Review SEO Request</h2>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedRequest(null)} disabled={isActionLoading}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="grid gap-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">User Details</label>
                            <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                                <p className="font-bold">{selectedRequest.user_name}</p>
                                <p className="text-sm text-muted-foreground">{selectedRequest.user_email}</p>
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Site & Activity</label>
                            <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Store Name:</span>
                                    <span className="font-semibold text-sm">{selectedRequest.site_name}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Domain:</span>
                                    <span className="font-mono">{selectedRequest.site_domain}</span>
                                </div>
                                <div className="flex justify-between items-center border-t pt-2 mt-2">
                                    <span className="text-sm">Total Products:</span>
                                    <Badge variant="secondary">{selectedRequest.product_count}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Submission Info</label>
                            <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                                <p className="text-sm flex items-center gap-2"><Clock className="h-3 w-3" /> {format(new Date(selectedRequest.created_at), 'PPPp')}</p>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs font-medium">Current Status:</span>
                                    <Badge variant={getStatusBadgeVariant(selectedRequest.status)}>{selectedRequest.status}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={() => setSelectedRequest(null)} disabled={isActionLoading}>Close</Button>
                    {selectedRequest.status === 'pending' && (
                        <Button onClick={handleMarkAsComplete} disabled={isActionLoading}>
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Mark as Complete
                        </Button>
                    )}
                </div>
            </div>
        </div>
      )}
    </>
  );
}