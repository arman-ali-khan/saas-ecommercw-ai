
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { Eye, Loader2, User, CreditCard, FileText, X, CheckCircle2, ShieldAlert, Search, Filter, RefreshCw, Zap, ChevronLeft, ChevronRight, AlertTriangle, Save } from 'lucide-react';
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
  const [updatedTrxId, setUpdatedTrxId] = useState('');

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

    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/subscriptions/list', { cache: 'no-store' });
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

  const handleAutoCheck = useCallback(async (isManual = true) => {
    if (isManual) setIsActionLoading(true);
    try {
      const response = await fetch('https://and-api.vercel.app/api/sms?userid=sam');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error("SMS API fetch failed");

      const smsData = result.data || [];
      const paymentLogs = new Map<string, number>(); // Map<TrxID, Amount>
      
      smsData.forEach((item: any) => {
        const msg = item.message || '';
        const trxMatches = msg.match(/(?:TrxID|TxnID)[:\s]*([A-Z0-9]+)/gi);
        const amountMatch = msg.match(/Amount: Tk ([\d.]+)/i);
        
        if (trxMatches && amountMatch) {
            const amount = parseFloat(amountMatch[1]);
            trxMatches.forEach((m: string) => {
                const id = m.replace(/(?:TrxID|TxnID)[:\s]*/i, '').trim().toUpperCase();
                if (id.length >= 4) paymentLogs.set(id, amount);
            });
        }
      });

      const currentPayments = useSaasStore.getState().subscriptions;
      const pending = currentPayments.filter(p => p.status === 'pending_verification' || p.status === 'pending');
      let processedCount = 0;

      for (const p of pending) {
        const submittedId = p.transaction_id?.toUpperCase();
        if (submittedId && paymentLogs.has(submittedId)) {
          const smsAmount = paymentLogs.get(submittedId) || 0;
          const requiredAmount = p.amount;

          if (smsAmount >= requiredAmount) {
            const updateRes = await fetch('/api/saas/subscriptions/update-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paymentId: p.id, newStatus: 'completed' }),
            });
            if (updateRes.ok) processedCount++;
          } else {
            // Notify user of partial payment
            await fetch('/api/notifications/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipientId: p.user_id,
                    recipientType: 'admin',
                    siteId: p.user_id,
                    message: `Your subscription auto-verify failed. Paid: ${smsAmount} BDT, but ${requiredAmount} BDT need to pay. Please check or contact support.`,
                    link: '/admin/settings',
                }),
            });
          }
        }
      }

      if (processedCount > 0) {
        toast({ title: 'Smart Sync Complete', description: `${processedCount} subscriptions verified.` });
        await fetchPayments(true);
      } else if (isManual) {
        toast({ title: 'Sync Complete', description: 'No new verifiable payments found.' });
      }
    } catch (e: any) {
      if (isManual) toast({ variant: 'destructive', title: 'Sync Failed', description: e.message });
    } finally {
      if (isManual) setIsActionLoading(false);
    }
  }, [fetchPayments, toast]);

  useEffect(() => {
    if (!user?.isSaaSAdmin) return;
    const intervalId = setInterval(() => handleAutoCheck(false), 60000);
    return () => clearInterval(intervalId);
  }, [user, handleAutoCheck]);

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

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * PAYMENTS_PER_PAGE,
    currentPage * PAYMENTS_PER_PAGE
  );

  useEffect(() => {
    if (selectedPayment) {
        setUpdatedTrxId(selectedPayment.transaction_id || '');
    }
  }, [selectedPayment]);

  const handleUpdateStatus = async (paymentId: string, newPaymentStatus: 'completed' | 'canceled') => {
    setIsActionLoading(true);
    try {
        const response = await fetch('/api/saas/subscriptions/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                paymentId, 
                newStatus: newPaymentStatus,
                updatedTransactionId: updatedTrxId !== selectedPayment?.transaction_id ? updatedTrxId : undefined
            }),
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

  const formatPaymentMethod = (methodValue: string) => {
    if (methodValue === 'mobile_banking') return 'Mobile Banking';
    if (methodValue === 'credit_card') return 'Credit Card';
    if (methodValue === 'sslcommerz') return 'Online Payment';
    return methodValue || 'Unknown';
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
                        onClick={() => handleAutoCheck(true)}
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
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayments.map(paymentItem => (
                <TableRow key={paymentItem.id} className="hover:bg-muted/10">
                  <TableCell className="font-medium pl-6 py-4">
                      <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                              <AvatarFallback className="font-bold text-[10px] bg-primary/5 text-primary">{paymentItem.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className="font-bold text-sm">{paymentItem.profiles?.full_name || 'Deleted User'}</span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">@{paymentItem.profiles?.username || 'unknown'}</span>
                          </div>
                      </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-[10px] font-bold h-5">{paymentItem.plans?.name || 'N/A'}</Badge></TableCell>
                  <TableCell className="text-sm font-black text-primary">৳{paymentItem.amount.toFixed(2)}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{paymentItem.transaction_id || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={paymentItem.status === 'completed' ? 'default' : paymentItem.status === 'canceled' ? 'destructive' : 'secondary'} className="text-[10px] h-5 px-2 uppercase font-black">
                        {paymentItem.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(paymentItem)} className="h-8 text-[10px] font-black uppercase px-3 rounded-lg border hover:bg-muted">
                      <Eye className="mr-1.5 h-3 w-3" /> Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isActionLoading && setSelectedPayment(null)} />
            <div className="relative w-full max-w-lg bg-background rounded-[2rem] shadow-2xl border-2 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b flex justify-between items-center shrink-0 bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl"><Eye className="h-5 w-5 text-primary" /></div>
                        <h2 className="text-xl font-bold">Review Payment</h2>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedPayment(null)} disabled={isActionLoading}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="space-y-2 p-5 rounded-2xl border-2 bg-muted/10">
                        <h4 className="font-black text-primary text-[10px] uppercase tracking-[0.2em] mb-3">Admin Info</h4>
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                <AvatarFallback className="font-bold">{selectedPayment.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="grid gap-0.5">
                                <p className="font-black text-base">{selectedPayment.profiles?.full_name || 'Deleted User'}</p>
                                <p className="text-xs text-muted-foreground font-bold">@{selectedPayment.profiles?.username || 'unknown'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl border-2 bg-muted/10 space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Required Amount</Label>
                            <p className="font-black text-lg text-primary">৳{selectedPayment.amount.toFixed(2)}</p>
                        </div>
                        <div className="p-5 rounded-2xl border-2 bg-muted/10 space-y-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan</Label>
                            <p className="font-bold text-sm">{selectedPayment.plans?.name || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="space-y-4 p-5 rounded-2xl border-2 bg-muted/10">
                        <h4 className="font-black text-primary text-[10px] uppercase tracking-[0.2em] mb-2">Transaction Details</h4>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold">Transaction ID</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={updatedTrxId} 
                                        onChange={(e) => setUpdatedTrxId(e.target.value.toUpperCase())}
                                        placeholder="Enter TrxID"
                                        className="h-11 rounded-xl font-mono text-lg font-bold"
                                    />
                                    {updatedTrxId !== selectedPayment.transaction_id && (
                                        <div className="flex items-center text-[10px] text-amber-600 font-bold animate-pulse">Modified</div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Payment Method:</span>
                                <span className="font-black">{formatPaymentMethod(selectedPayment.payment_method)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t flex flex-col sm:flex-row gap-3 shrink-0 bg-muted/30 pb-10">
                    <div className="grid grid-cols-2 gap-3 w-full sm:order-2">
                        <Button 
                            onClick={() => handleUpdateStatus(selectedPayment.id.toString(), 'completed')} 
                            disabled={isActionLoading || selectedPayment.status === 'completed'}
                            className="h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black"
                        >
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            APPROVE
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => handleUpdateStatus(selectedPayment.id.toString(), 'canceled')} 
                            disabled={isActionLoading || selectedPayment.status === 'canceled'}
                            className="h-12 rounded-xl font-black"
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
