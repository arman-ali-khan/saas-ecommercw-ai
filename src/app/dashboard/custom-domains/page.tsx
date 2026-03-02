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
import { Loader2, Search, X, CheckCircle2, ShieldAlert, Globe, Filter, Save, Plus, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/stores/auth';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

type DNSRecord = {
    type: 'A' | 'CNAME' | 'TXT' | string;
    host: string;
    value: string;
};

export default function CustomDomainsManagerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CustomDomainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState<CustomDomainRequest | null>(null);
  
  // Configuration State
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'active'>('pending');
  const [dnsRecords, setDnsRecords] = useState<DNSRecord[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
    // Initialize with existing data or default records
    if (Array.isArray(req.dns_info)) {
        setDnsRecords(req.dns_info);
    } else {
        // Default template for a new review
        setDnsRecords([
            { type: 'A', host: '@', value: '76.76.21.21' },
            { type: 'CNAME', host: 'www', value: 'cname.vercel-dns.com' }
        ]);
    }
  };

  const addRecord = (type: string = 'A') => {
      setDnsRecords([...dnsRecords, { type, host: '', value: '' }]);
  };

  const updateRecord = (index: number, field: keyof DNSRecord, value: string) => {
      const newRecords = [...dnsRecords];
      newRecords[index][field] = value;
      setDnsRecords(newRecords);
  };

  const removeRecord = (index: number) => {
      setDnsRecords(dnsRecords.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (!selectedReq) return;
    
    // Validate records
    const hasEmpty = dnsRecords.some(r => !r.host.trim() || !r.value.trim());
    if (hasEmpty && status !== 'rejected') {
        toast({ variant: 'destructive', title: 'Incomplete Records', description: 'Please fill in all host and value fields.' });
        return;
    }

    setIsActionLoading(true);
    try {
        const response = await fetch('/api/saas/custom-domains/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: selectedReq.id,
                siteId: selectedReq.site_id,
                status,
                dnsInfo: dnsRecords // Array of records
            }),
        });
        if (response.ok) {
            toast({ title: 'Request Updated', description: 'Domain settings and DNS instructions saved.' });
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Domain Management</h1>
          <p className="text-muted-foreground">Review custom domain requests and provide DNS setup info.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by domain or site..." 
                        className="pl-10 h-11 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-44 h-11 rounded-xl">
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
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Store & Admin</TableHead>
                <TableHead>Custom Domain</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="pl-6 py-4">
                    <div className="font-bold text-sm">{req.profiles?.site_name}</div>
                    <div className="text-[10px] w-44 truncate text-muted-foreground uppercase tracking-wider">@{req.profiles?.domain} • {req.profiles?.full_name}</div>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-semibold text-primary">{req.custom_domain}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(req.created_at), 'PP')}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === 'active' ? 'default' : (req.status === 'approved' ? 'secondary' : 'outline')} className="capitalize">
                        {req.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="outline" size="sm" className="rounded-lg h-8" onClick={() => handleReview(req)}>Configure</Button>
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

      {/* Configuration Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isActionLoading && setSelectedReq(null)} />
            <div className="relative w-full max-w-2xl bg-background rounded-[2rem] shadow-2xl border-2 border-primary/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center bg-muted/30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl"><Globe className="h-5 w-5 text-primary" /></div>
                        <h2 className="text-xl font-bold">Domain Configuration</h2>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedReq(null)} disabled={isActionLoading}><X className="h-5 w-5" /></Button>
                </div>
                
                <ScrollArea className="flex-grow ovherflow-y-auto">
                    <div className="p-6 space-y-8">
                        <div className="p-5 rounded-2xl bg-muted/20 border-2 border-dashed space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Requested Domain</span>
                                <span className="font-mono text-lg text-primary font-black">{selectedReq.custom_domain}</span>
                            </div>
                            <Separator className="bg-border/50" />
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Management Status</Label>
                                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent className="z-[110]">
                                        <SelectItem value="pending">Pending Review</SelectItem>
                                        <SelectItem value="approved">Approved (Awaiting Setup)</SelectItem>
                                        <SelectItem value="active">Active (Successfully Connected)</SelectItem>
                                        <SelectItem value="rejected">Rejected / Error</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">DNS Instructions</h3>
                                <div className="flex gap-2">
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black text-primary hover:bg-primary/5" onClick={() => addRecord('A')}>+ A Record</Button>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black text-primary hover:bg-primary/5" onClick={() => addRecord('CNAME')}>+ CNAME</Button>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] uppercase font-black text-primary hover:bg-primary/5" onClick={() => addRecord('TXT')}>+ TXT</Button>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                {dnsRecords.map((record, idx) => (
                                    <div key={idx} className="group grid grid-cols-12 gap-2 p-3 rounded-xl border bg-card/50 relative transition-all hover:border-primary/30">
                                        <div className="col-span-3">
                                            <Select value={record.type} onValueChange={(v) => updateRecord(idx, 'type', v)}>
                                                <SelectTrigger className="h-9 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                                                <SelectContent className="z-[110]">
                                                    <SelectItem value="A">A Record</SelectItem>
                                                    <SelectItem value="CNAME">CNAME</SelectItem>
                                                    <SelectItem value="TXT">TXT</SelectItem>
                                                    <SelectItem value="MX">MX</SelectItem>
                                                    <SelectItem value="NS">NS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-4">
                                            <Input 
                                                placeholder="Host (e.g. @)" 
                                                value={record.host} 
                                                onChange={e => updateRecord(idx, 'host', e.target.value)}
                                                className="h-9 text-[10px] font-mono"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <Input 
                                                placeholder="Value" 
                                                value={record.value} 
                                                onChange={e => updateRecord(idx, 'value', e.target.value)}
                                                className="h-9 text-[10px] font-mono"
                                            />
                                        </div>
                                        <div className="col-span-1 flex justify-end">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-lg" onClick={() => removeRecord(idx)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                
                                {dnsRecords.length === 0 && (
                                    <div className="text-center py-10 border-2 border-dashed rounded-2xl bg-muted/5">
                                        <p className="text-xs text-muted-foreground">No DNS instructions added. Use the buttons above to add records.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-6 border-t flex justify-end gap-3 shrink-0 bg-muted/30">
                    <Button variant="outline" onClick={() => setSelectedReq(null)} disabled={isActionLoading} className="rounded-xl h-12 px-6">Cancel</Button>
                    <Button onClick={handleUpdate} disabled={isActionLoading} className="rounded-xl h-12 px-8 font-bold shadow-lg shadow-primary/20">
                        {isActionLoading ? <><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save & Notify Admin</>}
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
