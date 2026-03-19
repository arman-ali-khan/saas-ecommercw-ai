
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import type { SubscriptionPaymentWithDetails } from '@/types';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';

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
import { useToast } from '@/hooks/use-toast';
import { Eye, Loader2, User, CreditCard, FileText, X, CheckCircle2, ShieldAlert, Search, Filter, RefreshCw, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const PAYMENTS_PER_PAGE = 10;

export default function SubscriptionPaymentsPage() {
  const { user } = useAuth();
  const { subscriptions: payments, setSubscriptions } = useSaasStore();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoading, setIsLoading] = useState(() => {
    const currentStore = useSaasStore.getState();
    return currentStore.subscriptions.length === 0;
  });

  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPaymentWithDetails | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchPayments = useCallback(async (force = false) => {
    const currentStore = useSaasStore.getState();
    const now = Date.now();
    const isFresh = now - currentStore.lastFetched.subscriptions < 300000;
    
    if (!force && currentStore.subscriptions.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    if (currentStore.subscriptions.length === 0 || force) {
        setIsLoading(true);
    }

    try {
        const response = await fetch('/api/saas/subscriptions/list');
        const result = await response.json();

        if (response.ok) {
            setSubscriptions(result.payments || []);
        } else {
            throw new Error(result.error || 'Failed to fetch payments');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [setSubscriptions, toast]);
  
  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [fetchPayments, user]);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            (p.profiles?.full_name || '').toLowerCase().includes(searchLower) ||
            (p.transaction_id || '').toLowerCase().includes(searchLower) ||
            (p.plans?.name || '').toLowerCase().includes(searchLower);
        
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * PAYMENTS_PER_PAGE,
    currentPage * PAYMENTS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleUpdateStatus = async (paymentId: string, newPaymentStatus: 'completed' | 'canceled') => {
    setIsActionLoading(true);
    try {
        const response = await fetch('/api/saas/subscriptions/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId, newStatus: newPaymentStatus }),
        });

        const result = await response.json();

        if (response.ok) {
            toast({ title: 'Success', description: `Payment reviewed and status updated.` });
            await fetchPayments(true);
            setSelectedPayment(null);
        } else {
            throw new Error(result.error || 'Failed to update subscription status');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action failed', description: e.message });
    } finally {
        setIsActionLoading(false);
    }
  };

  const handleAutoCheck = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch('https://and-api.vercel.app/api/sms?userid=sam');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error("SMS API fetch failed");

      const smsData = result.data || [];
      // Extract unique TrxIDs from SMS messages
      const extractedTrxIds = new Set<string>();
      
      smsData.forEach((item: any) => {
        const msg = item.message || '';
        // Regex to find TrxID or TxnID (handles various formats from Nagad/bKash)
        const matches = msg.match(/(?:TrxID|TxnID)[:\s]*([A-Z0-9]+)/gi);
        if (matches) {
            matches.forEach((m: string) => {
                const id = m.replace(/(?:TrxID|TxnID)[:\s]*/i, '').trim().toUpperCase();
                if (id.length >= 8) extractedTrxIds.add(id);
            });
        }
      });

      const pending = payments.filter(p => p.status === 'pending_verification' || p.status === 'pending');
      let confirmedCount = 0;

      for (const p of pending) {
        if (p.transaction_id && extractedTrxIds.has(p.transaction_id.toUpperCase())) {
          // Auto-confirm
          const updateRes = await fetch('/api/saas/subscriptions/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId: p.id, newStatus: 'completed' }),
          });
          if (updateRes.ok) confirmedCount++;
        }
      }

      if (confirmedCount > 0) {
        toast({ title: 'Smart Sync Complete', description: `${confirmedCount} pending subscriptions confirmed automatically.` });
        await fetchPayments(true);
      } else {
        toast({ title: 'Sync Complete', description: 'No matching transaction IDs found in recent SMS logs.' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Sync Failed', description: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };


  const getStatusBadgeVariant = (statusValue: string): "default" | "secondary" | "destructive" => {
    switch (statusValue?.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
      case 'pending_verification':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const formatPaymentMethod = (methodValue: string) => {
    if (methodValue === 'mobile_banking') return 'Mobile Banking';
    if (methodValue === 'credit_card') return 'Credit Card';
    return methodValue || 'Unknown';
  }

  if (isLoading && payments.length === 0) {
      return (
        <Card>
            <CardHeader>
                <CardTitle>Subscription Payments</CardTitle>
                <CardDescription>Loading payment history from the database...</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
      )
  }

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Subscription Payments</CardTitle>
                    <CardDescription>View all historical subscription payment records.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        size="sm" 
                        className="rounded-full font-bold h-9 px-4 shadow-sm border bg-primary/5 hover:bg-primary/10 text-primary border-primary/20" 
                        onClick={handleAutoCheck}
                        disabled={isActionLoading}
                    >
                        {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                        Smart Sync (SMS)
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={() => fetchPayments(true)} disabled={isActionLoading}>
                        <RefreshCw className={cn("h-4 w-4", isActionLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name or transaction ID..." 
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
                    <SelectContent className="z-[110]">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending_verification">Pending</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== 'all') && (
                    <Button variant="ghost" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="h-11 w-11 rounded-xl">
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent className="p-0">
          {paginatedPayments.length > 0 ? (
            <>
              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="pl-6">User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map(paymentItem => (
                      <TableRow key={paymentItem.id} className="hover:bg-muted/10 transition-colors">
                        <TableCell className="font-medium pl-6 py-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 ring-2 ring-background">
                                    <AvatarFallback className="font-bold text-[10px] bg-primary/5 text-primary">{paymentItem.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm">{paymentItem.profiles?.full_name || 'Deleted User'}</span>
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">@{paymentItem.profiles?.username || 'unknown'}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px] font-bold h-5">{paymentItem.plans?.name || 'N/A'}</Badge></TableCell>
                        <TableCell className="text-sm font-black text-primary">৳{paymentItem.amount.toFixed(2)}</TableCell>
                        <TableCell className="font-mono truncate max-w-[100px] text-xs font-bold text-muted-foreground">{paymentItem.transaction_id || 'N/A'}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-bold">{format(new Date(paymentItem.created_at), 'PP')}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(paymentItem.status)} className="text-[10px] h-5 px-2 uppercase font-black">{paymentItem.status}</Badge></TableCell>
                        <TableCell className="text-right pr-6">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(paymentItem)} className="h-8 text-[10px] font-black uppercase px-3 rounded-lg border hover:bg-muted">
                            <Eye className="mr-1.5 h-3 w-3" /> Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile View: Cards */}
              <div className="grid gap-4 md:hidden p-4">
                {paginatedPayments.map(paymentItem => (
                  <Card key={paymentItem.id} onClick={() => setSelectedPayment(paymentItem)} className="cursor-pointer hover:bg-muted/50 transition-colors border shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="font-bold bg-primary/5 text-primary">{paymentItem.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-sm font-bold">{paymentItem.profiles?.full_name || 'Deleted User'}</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-widest">@{paymentItem.profiles?.username || 'unknown'}</CardDescription>
                                </div>
                            </div>
                             <Badge variant={getStatusBadgeVariant(paymentItem.status)} className="text-[8px] h-4 font-black uppercase">{paymentItem.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 flex justify-between items-center">
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-[10px] h-5 font-bold">{paymentItem.plans?.name || 'N/A'}</Badge>
                            <p className="text-[10px] text-muted-foreground font-bold">{format(new Date(paymentItem.created_at), 'PP')}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-primary text-base">৳{paymentItem.amount.toFixed(2)}</p>
                            {paymentItem.transaction_id && <p className="text-[8px] font-mono text-muted-foreground mt-0.5">{paymentItem.transaction_id}</p>}
                          </div>
                      </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-muted-foreground flex flex-col items-center">
              <FileText className="h-12 w-12 opacity-10 mb-4" />
              <p className="font-medium text-lg">No payment records found matching your criteria.</p>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="justify-center border-t py-6 bg-muted/10">
                <div className="flex items-center gap-4 text-xs sm:text-sm">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prevPage => Math.max(1, prevPage - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg h-9"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    <span className="text-muted-foreground font-black uppercase tracking-tighter">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prevPage => Math.min(totalPages, prevPage + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg h-9"
                    >
                        Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>

      {/* Custom Review Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isActionLoading && setSelectedPayment(null)} />
            <div className="relative w-full max-w-lg bg-background rounded-[2rem] shadow-2xl border-2 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center shrink-0 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl"><Eye className="h-5 w-5 text-primary" /></div>
                        <h2 className="text-xl font-bold">Review Payment</h2>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedPayment(null)} disabled={isActionLoading}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="space-y-2 p-5 rounded-2xl border-2 bg-muted/10">
                            <h4 className="font-black flex items-center gap-2 text-primary text-[10px] uppercase tracking-[0.2em] mb-3"><User className="h-3.5 w-3.5" /> Admin Info</h4>
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                    <AvatarFallback className="font-bold">{selectedPayment.profiles?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="grid gap-0.5">
                                    <p className="font-black text-base">{selectedPayment.profiles?.full_name || 'Deleted User'}</p>
                                    <p className="text-xs text-muted-foreground font-bold">@{selectedPayment.profiles?.username || 'unknown'} • {(selectedPayment.profiles as any)?.email}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl border-2 bg-muted/10 space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selected Plan</Label>
                                <p className="font-black text-lg text-foreground">{selectedPayment.plans?.name || 'N/A'}</p>
                            </div>
                            <div className="p-5 rounded-2xl border-2 bg-primary/5 border-primary/10 space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Amount Paid</Label>
                                <p className="font-black text-xl text-primary">৳{selectedPayment.amount.toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="space-y-2 p-5 rounded-2xl border-2 bg-muted/10">
                            <h4 className="font-black flex items-center gap-2 text-primary text-[10px] uppercase tracking-[0.2em] mb-4"><CreditCard className="h-3.5 w-3.5" /> Transaction Metadata</h4>
                            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                                <div className="space-y-1">
                                    <label className="text-muted-foreground font-bold text-[10px] uppercase block">Method</label>
                                    <p className="font-black text-xs">{formatPaymentMethod(selectedPayment.payment_method)}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground font-bold text-[10px] uppercase block">Transaction ID</label>
                                    <code className="font-mono font-black text-xs bg-muted px-2 py-1 rounded-lg border block w-fit">{selectedPayment.transaction_id || 'N/A'}</code>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground font-bold text-[10px] uppercase block">Current Status</label>
                                    <Badge variant={getStatusBadgeVariant(selectedPayment.status)} className="font-black uppercase text-[8px] h-5 px-2">{selectedPayment.status}</Badge>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-muted-foreground font-bold text-[10px] uppercase block">Submitted On</label>
                                    <p className="text-xs font-bold">{format(new Date(selectedPayment.created_at), 'PPpp')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t flex flex-col sm:flex-row gap-3 shrink-0 bg-muted/30 pb-10 sm:pb-6">
                    <div className="grid grid-cols-2 gap-3 w-full sm:order-2">
                        <Button 
                            onClick={() => handleUpdateStatus(selectedPayment.id.toString(), 'completed')} 
                            disabled={isActionLoading || selectedPayment.status === 'completed'}
                            className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black shadow-lg shadow-green-900/20"
                        >
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            APPROVE
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => handleUpdateStatus(selectedPayment.id.toString(), 'canceled')} 
                            disabled={isActionLoading || selectedPayment.status === 'canceled'}
                            className="h-12 rounded-xl font-black shadow-lg shadow-destructive/20"
                        >
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                            REJECT
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedPayment(null)} disabled={isActionLoading} className="w-full sm:w-auto h-12 rounded-xl font-bold sm:order-1 px-8">Cancel</Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
