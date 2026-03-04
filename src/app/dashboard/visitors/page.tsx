
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
import { Loader2, Search, X, Globe, MapPin, Monitor, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/stores/auth';

const VISITORS_PER_PAGE = 15;

export default function VisitorLogsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

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
            v.isp?.toLowerCase().includes(searchLower)
        );
    });
  }, [visitors, searchQuery]);

  const totalPages = Math.ceil(filteredVisitors.length / VISITORS_PER_PAGE);
  const paginatedVisitors = filteredVisitors.slice(
    (currentPage - 1) * VISITORS_PER_PAGE,
    currentPage * VISITORS_PER_PAGE
  );

  if (isLoading) {
    return <div className="flex justify-center items-center py-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Visitor Logs</h1>
            <p className="text-muted-foreground mt-1">Real-time geolocation data of people visiting your platform.</p>
          </div>
          <Button variant="outline" onClick={fetchVisitors} className="rounded-full">
            Refresh Data
          </Button>
      </div>

      <Card className="border-2">
        <CardHeader>
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search by IP, City, or ISP..." 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="pl-10 h-11 rounded-xl"
                />
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="pl-6">IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>ISP / Network</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right pr-6">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedVisitors.map((visitor) => (
                  <TableRow key={visitor.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="pl-6 font-mono text-xs font-bold text-primary">
                      {visitor.ip}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{visitor.city}, {visitor.country}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {visitor.isp}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(visitor.created_at), 'PPPp')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-black" onClick={() => {
                            toast({ 
                                title: "User Agent", 
                                description: visitor.user_agent,
                                duration: 10000 
                            });
                        }}>UA</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVisitors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No visitor logs found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="justify-center border-t py-4">
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
