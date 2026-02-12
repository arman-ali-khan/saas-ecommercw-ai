
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
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
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SeoRequestsPage() {
  const [requests, setRequests] = useState<SeoRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SeoRequest | null>(null);
  const { toast } = useToast();
  
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('seo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching requests', description: error.message });
    } else {
      setRequests(data as SeoRequest[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchRequests();
    
    const channel = supabase
      .channel('seo-requests-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'seo_requests' }, fetchRequests)
      .subscribe();
      
    return () => { supabase.removeChannel(channel) };
  }, [fetchRequests]);
  
  const handleMarkAsComplete = async () => {
    if (!selectedRequest) return;
    setIsActionLoading(true);
    const { error } = await supabase
        .from('seo_requests')
        .update({ status: 'completed' })
        .eq('id', selectedRequest.id);

    setIsActionLoading(false);
    if(error) {
        toast({ variant: 'destructive', title: 'Failed to update status', description: error.message });
    } else {
        toast({ title: 'Request marked as complete!' });
        setSelectedRequest(null);
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
                            <div className="font-medium">{req.user_name}</div>
                            <div className="text-sm text-muted-foreground">{req.user_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{req.site_name}</div>
                        <div className="text-sm text-muted-foreground">{req.site_domain}</div>
                      </TableCell>
                       <TableCell>{req.product_count}</TableCell>
                      <TableCell>{format(new Date(req.created_at), 'PP')}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(req.status)}>
                          {req.status}
                        </Badge>
                      </TableCell>
                       <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRequest(req)}>
                            Review
                          </Button>
                        </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Review SEO Request</DialogTitle>
                <DialogDescription>Details for the request from {selectedRequest?.user_name}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
                <p><strong>User:</strong> {selectedRequest?.user_name} ({selectedRequest?.user_email})</p>
                <p><strong>Site:</strong> {selectedRequest?.site_name} ({selectedRequest?.site_domain})</p>
                <p><strong>Product Count:</strong> {selectedRequest?.product_count}</p>
                <p><strong>Requested At:</strong> {selectedRequest && format(new Date(selectedRequest.created_at), 'PPPp')}</p>
                <div className="flex items-center gap-2">
                    <strong>Status:</strong> <Badge variant={getStatusBadgeVariant(selectedRequest?.status || 'pending')}>{selectedRequest?.status}</Badge>
                </div>
            </div>
            <DialogFooter>
                {selectedRequest?.status === 'pending' && (
                    <Button onClick={handleMarkAsComplete} disabled={isActionLoading}>
                        {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Mark as Complete
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    