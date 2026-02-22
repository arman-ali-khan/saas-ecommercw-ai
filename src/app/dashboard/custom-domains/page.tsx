
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { type CustomDomainRequest } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X, CheckCircle2, ShieldAlert, Globe, ExternalLink, Filter, Save } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/stores/auth';
import { Label } from '@/components/ui/label';

const ITEMS_PER_PAGE = 10;

export default function CustomDomainsManagerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CustomDomainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState<CustomDomainRequest | null>(null);
  
  // Edit State
  const [dnsType, setDnsType] = useState('CNAME');
  const [dnsValue, setDnsValue] = useState('www');
  const [dnsPointsTo, setDnsPointsTo] = useState('cname.vercel-dns.com');
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'active'>('pending');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saas/custom-domains/list');
      const result = await response.json();
      if (response.ok) {
        setRequests(result.requests || []);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) fetchData();
  }, [fetchData, user]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch = r.custom_domain.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           r.profiles?.site_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const handleReview = (req: CustomDomainRequest) => {
    setSelectedReq(req);
    setStatus(req.status);
    if (req.dns_info) {
        setDnsType(req.dns_info.type || 'CNAME');
        setDnsValue(req.dns_info.value || 'www');
        setDnsPointsTo(req.dns_info.pointsTo || 'cname.vercel-dns.com');
    }
  };

  const handleUpdate = async () => {
    if (!selectedReq) return;
    setIsActionLoading(true);
    try {
        const response = await fetch('/api/saas/custom-domains/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedReq.id,
                siteId: selectedReq.site_id,
                status,
                dnsInfo: { type: dnsType, value: dnsValue, pointsTo: dnsPointsTo }
            }),
        });
        if (response.ok) {
            toast({ title: 'Request Updated', description: 'Domain settings have been saved.' });
            await fetchData();
            setSelectedReq(null);
        } else {
            const res = await response.json();
            throw new Error(res.error);
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Failed to update', description: e.message });
    } finally {
        setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Domain Management</h1>
          <p className="text-muted-foreground">Handle custom domain requests from store owners.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by domain or site..." 
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44">
                        <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store & Admin</TableHead>
                <TableHead>Custom Domain</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell>
                    <div className="font-bold text-sm">{req.profiles?.site_name}</div>
                    <div className="text-[10px] text-muted-foreground">@{req.profiles?.domain} • {req.profiles?.full_name}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold">{req.custom_domain}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'PP')}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'active' ? 'default' : 'secondary'}>{req.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleReview(req)}>Review</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No requests found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isActionLoading && setSelectedReq(null)} />
            <div className="relative w-full max-w-xl bg-background rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold">Domain Configuration</h2>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedReq(null)} disabled={isActionLoading}><X className="h-5 w-5" /></Button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">Custom Domain:</span>
                            <span className="font-mono text-primary font-bold">{selectedReq.custom_domain}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Internal ID:</span>
                            <span className="text-xs">{selectedReq.site_id}</span>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label>Management Status</Label>
                            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent className="z-[110]">
                                    <SelectItem value="pending">Pending Review</SelectItem>
                                    <SelectItem value="approved">Approved (Awaiting DNS)</SelectItem>
                                    <SelectItem value="active">Active (Verified)</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator />
                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">DNS Instructions (Vercel Info)</h3>
                        
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px]">Type</Label>
                                <Select value={dnsType} onValueChange={setDnsType}>
                                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                    <SelectContent className="z-[110]">
                                        <SelectItem value="CNAME">CNAME</SelectItem>
                                        <SelectItem value="A">A Record</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px]">Name/Host</Label>
                                <Input value={dnsValue} onChange={e => setDnsValue(e.target.value)} className="h-9" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px]">Points To</Label>
                                <Input value={dnsPointsTo} onChange={e => setDnsPointsTo(e.target.value)} className="h-9" />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">Add this domain to your Vercel project first, then provide the CNAME/A record info here for the user.</p>
                    </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={() => setSelectedReq(null)} disabled={isActionLoading}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={isActionLoading} className="shadow-lg shadow-primary/20">
                        {isActionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
