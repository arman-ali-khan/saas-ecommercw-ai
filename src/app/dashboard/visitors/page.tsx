'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { type Visitor } from '@/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Input } from '@/components/ui/input';
import { 
    Loader2, 
    Search, 
    X, 
    Globe, 
    MapPin, 
    Monitor, 
    Clock, 
    ChevronLeft, 
    ChevronRight,
    ShieldAlert,
    Smartphone,
    Server,
    DollarSign,
    Info,
    Layout,
    Network
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const VISITORS_PER_PAGE = 15;

export default function VisitorLogsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  const fetchVisitors = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'visitors' }),
        });
        const result = await response.json();
        if (response.ok) {
            setVisitors(result.data as Visitor[]);
        } else {
            throw new Error(result.error || 'Failed to fetch visitors');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user?.isSaaSAdmin) {
      fetchVisitors();
    }
  }, [fetchVisitors, user]);

  const filteredVisitors = useMemo(() => {
    return visitors.filter(v => {
        const searchLower = searchQuery.toLowerCase();
        return (
            v.ip?.toLowerCase().includes(searchLower) ||
            v.city?.toLowerCase().includes(searchLower) ||
            v.country?.toLowerCase().includes(searchLower) ||
            v.isp?.toLowerCase().includes(searchLower) ||
            v.org?.toLowerCase().includes(searchLower)
        );
    });
  }, [visitors, searchQuery]);

  const totalPages = Math.ceil(filteredVisitors.length / VISITORS_PER_PAGE);
  const paginatedVisitors = filteredVisitors.slice(
    (currentPage - 1) * VISITORS_PER_PAGE,
    currentPage * VISITORS_PER_PAGE
  );

  const StatusBadge = ({ label, active }: { label: string, active: boolean }) => (
    <Badge variant={active ? "destructive" : "secondary"} className="text-[10px] h-5 uppercase font-black px-2">
        {label}: {active ? "YES" : "NO"}
    </Badge>
  );

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 px-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Advanced Visitor Logs</h1>
            <p className="text-muted-foreground text-sm mt-1">Real-time network, geolocation, and security analysis of platform visitors.</p>
          </div>
          <Button variant="outline" onClick={fetchVisitors} className="rounded-full shadow-sm h-10 px-6">
            Refresh Data
          </Button>
      </div>

      <Card className="border-2 overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/10 border-b">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by IP, City, or Provider..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10 h-11 rounded-xl"
                />
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6 min-w-[180px]">Network (IP / ISP)</TableHead>
                  <TableHead className="min-w-[180px]">Location</TableHead>
                  <TableHead className="min-w-[150px]">Security Flags</TableHead>
                  <TableHead className="min-w-[150px]">Visit Time</TableHead>
                  <TableHead className="text-right pr-6">Analysis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVisitors.map((visitor) => (
                  <TableRow key={visitor.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <code className="text-sm font-black text-primary">{visitor.ip}</code>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight truncate max-w-[180px]">{visitor.isp}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-primary/60" />
                        <span className="text-sm font-medium">{visitor.city}, {visitor.country}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {visitor.is_proxy && <Badge variant="destructive" className="h-4 text-[8px] px-1 font-black">PROXY</Badge>}
                            {visitor.is_hosting && <Badge variant="destructive" className="h-4 text-[8px] px-1 font-black">HOSTING</Badge>}
                            {visitor.is_mobile && <Badge variant="secondary" className="h-4 text-[8px] px-1 font-black">MOBILE</Badge>}
                            {!visitor.is_proxy && !visitor.is_hosting && <Badge variant="outline" className="h-4 text-[8px] px-1 opacity-50 font-black">CLEAN</Badge>}
                        </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="h-3 w-3" />
                        {format(new Date(visitor.created_at), 'MMM d, p')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-8 rounded-lg text-[10px] font-black uppercase md:opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setSelectedVisitor(visitor)}
                        >
                            Analyze
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden p-4">
            {paginatedVisitors.map((visitor) => (
                <Card key={visitor.id} className="border shadow-sm overflow-hidden" onClick={() => setSelectedVisitor(visitor)}>
                    <CardHeader className="p-4 bg-muted/10 border-b">
                        <div className="flex justify-between items-center">
                            <code className="text-sm font-black text-primary">{visitor.ip}</code>
                            <Badge variant="outline" className="text-[8px] h-4 font-black">
                                {visitor.country_code}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-bold">{visitor.city}, {visitor.country}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Network className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter">{visitor.isp}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                            {visitor.is_proxy && <Badge variant="destructive" className="h-4 text-[8px] px-1 font-black">PROXY</Badge>}
                            {visitor.is_hosting && <Badge variant="destructive" className="h-4 text-[8px] px-1 font-black">HOSTING</Badge>}
                            {visitor.is_mobile && <Badge variant="secondary" className="h-4 text-[8px] px-1 font-black">MOBILE</Badge>}
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-2 flex justify-between items-center bg-muted/5 border-t">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold">
                            <Clock className="h-3 w-3" />
                            {format(new Date(visitor.created_at), 'MMM d, p')}
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-primary">Details</Button>
                    </CardFooter>
                </Card>
            ))}
          </div>

          {filteredVisitors.length === 0 && (
            <div className="h-32 flex items-center justify-center text-muted-foreground italic">No visitor logs found matching your query.</div>
          )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="justify-center border-t py-6 bg-muted/10">
                <div className="flex items-center gap-4 text-xs sm:text-sm">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-9 px-3 rounded-lg">
                        <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                    </Button>
                    <span className="text-muted-foreground font-black uppercase tracking-tighter">Page {currentPage} / {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-9 px-3 rounded-lg">
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>

      {/* Visitor Detail / Analysis Modal */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-2xl rounded-t-[2.5rem] sm:rounded-[2rem] p-0 overflow-hidden border-2 shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <DialogHeader className="p-6 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl"><Monitor className="h-5 w-5 text-primary" /></div>
                    <DialogTitle className="text-lg sm:text-xl font-bold">Visitor Analysis: {selectedVisitor?.ip}</DialogTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedVisitor(null)} className="rounded-full h-10 w-10"><X className="h-5 w-5" /></Button>
            </DialogHeader>
            
            {selectedVisitor && (
                <ScrollArea className="flex-grow !overflow-y-auto">
                    <div className="p-6 sm:p-8 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 rounded-2xl border bg-muted/10 space-y-1 shadow-sm">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Country</Label>
                                <p className="font-bold flex items-center gap-2">{selectedVisitor.country} <Badge variant="outline" className="h-4 px-1.5 text-[8px] bg-background">{selectedVisitor.country_code}</Badge></p>
                            </div>
                            <div className="p-4 rounded-2xl border bg-muted/10 space-y-1 shadow-sm">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">City/Region</Label>
                                <p className="font-bold truncate">{selectedVisitor.city}, {selectedVisitor.region}</p>
                            </div>
                            <div className="p-4 rounded-2xl border bg-muted/10 space-y-1 shadow-sm">
                                <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Currency</Label>
                                <p className="font-bold flex items-center gap-2"><DollarSign className="h-3 w-3 text-primary" /> {selectedVisitor.currency || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 flex items-center gap-2">
                                <Network className="h-3 w-3" /> Network & Infrastructure
                            </h3>
                            <div className="grid gap-3">
                                <div className="p-5 rounded-2xl border bg-card space-y-3 shadow-sm">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-tighter">ISP:</span>
                                        <span className="font-black text-foreground text-right ml-4">{selectedVisitor.isp}</span>
                                    </div>
                                    <Separator className="opacity-50" />
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-tighter">Organization:</span>
                                        <span className="font-black text-foreground text-right ml-4">{selectedVisitor.org}</span>
                                    </div>
                                    <Separator className="opacity-50" />
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-muted-foreground font-bold uppercase tracking-tighter">AS Info:</span>
                                        <code className="text-[10px] bg-muted px-2 py-1 rounded-md font-mono">{selectedVisitor.as_info}</code>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 flex items-center gap-2">
                                <ShieldAlert className="h-3 w-3" /> Security Analysis
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge label="Proxy/VPN" active={!!selectedVisitor.is_proxy} />
                                <StatusBadge label="Datacenter/Hosting" active={!!selectedVisitor.is_hosting} />
                                <StatusBadge label="Mobile Network" active={!!selectedVisitor.is_mobile} />
                            </div>
                        </div>

                        {selectedVisitor.dns_info && (
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 flex items-center gap-2">
                                    <Server className="h-3 w-3" /> DNS Feedback
                                </h3>
                                <div className="p-4 rounded-2xl border bg-muted/20 space-y-2 font-mono text-[10px] shadow-inner">
                                    <div className="flex justify-between gap-4">
                                        <span className="opacity-50 font-bold uppercase">Geo Info:</span>
                                        <span className="text-right">{selectedVisitor.dns_info.geo}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="opacity-50 font-bold uppercase">Resolved IP:</span>
                                        <span>{selectedVisitor.dns_info.ip}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1 flex items-center gap-2">
                                <Layout className="h-3 w-3" /> Browser User Agent
                            </h3>
                            <div className="p-4 rounded-2xl border bg-muted/10 font-mono text-[10px] break-all leading-relaxed shadow-inner">
                                {selectedVisitor.user_agent}
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            )}
            <div className="p-6 border-t bg-muted/30 flex justify-end shrink-0 pb-10 sm:pb-6">
                <Button onClick={() => setSelectedVisitor(null)} className="rounded-xl h-12 px-10 font-bold w-full sm:w-auto shadow-lg shadow-primary/10">Close Analysis</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
