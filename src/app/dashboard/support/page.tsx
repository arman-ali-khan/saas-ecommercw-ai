'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X, MessageSquare, Filter, ArrowRight, Clock, CheckCircle2, AlertTriangle, ChevronRight, Store, User } from 'lucide-react';
import Link from 'next/link';
import type { SupportTicket } from '@/types';

const TICKETS_PER_PAGE = 15;

export default function SaasSupportTicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/support/tickets/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // SaaS admin fetches all
      });
      const result = await response.json();
      if (response.ok) {
        setTickets(result.tickets || []);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           t.profiles?.site_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           t.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredTickets.length / TICKETS_PER_PAGE);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * TICKETS_PER_PAGE,
    currentPage * TICKETS_PER_PAGE
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">In Progress</Badge>;
      case 'resolved': return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>;
      case 'closed': return <Badge variant="outline">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge variant="destructive" className="animate-pulse h-5 text-[10px]">Urgent</Badge>;
      case 'high': return <Badge variant="destructive" className="h-5 text-[10px]">High</Badge>;
      case 'normal': return <Badge variant="secondary" className="h-5 text-[10px]">Normal</Badge>;
      case 'low': return <Badge variant="outline" className="h-5 text-[10px]">Low</Badge>;
      default: return <Badge variant="outline" className="h-5 text-[10px]">{priority}</Badge>;
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Management</h1>
        <p className="text-muted-foreground">Manage help requests and issues from site administrators.</p>
      </div>

      <Card>
        <CardHeader>
            <div className="flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search tickets or sites..." 
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
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== 'all') && (
                    <Button variant="ghost" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                        <X className="h-4 w-4 mr-2" /> Clear
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue & Site</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTickets.map(ticket => (
                  <TableRow key={ticket.id} className="group">
                    <TableCell>
                      <div className="space-y-1">
                          <Link href={`/dashboard/support/${ticket.id}`} className="font-bold hover:text-primary transition-colors line-clamp-1">{ticket.title}</Link>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Badge variant="outline" className="px-1.5 py-0 rounded text-[10px] font-normal">{ticket.profiles?.site_name}</Badge>
                              <span>•</span>
                              <span>{ticket.profiles?.full_name}</span>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(ticket.updated_at), 'PPp')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/support/${ticket.id}`}>Review <ArrowRight className="ml-2 h-3 w-3" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden p-4">
            {paginatedTickets.map((ticket) => (
              <Link key={ticket.id} href={`/dashboard/support/${ticket.id}`}>
                <Card className="hover:border-primary/20 transition-colors border-2 active:scale-[0.98]">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Store className="h-3 w-3 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">{ticket.profiles?.site_name}</span>
                        </div>
                        <CardTitle className="text-base line-clamp-1 mt-1">{ticket.title}</CardTitle>
                      </div>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                    <div className="flex items-center justify-between">
                      {getStatusBadge(ticket.status)}
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(ticket.updated_at), 'MMM d, p')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 border-t mt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{ticket.profiles?.full_name}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 justify-end">
                    <span className="text-primary text-xs font-bold flex items-center">
                      Review Ticket <ChevronRight className="ml-1 h-3 w-3" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>

          {filteredTickets.length === 0 && (
            <div className="h-32 flex items-center justify-center text-muted-foreground italic">No tickets found.</div>
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
    </div>
  );
}
