'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { SubscriptionPaymentWithDetails } from '@/types';
import { useAuth } from '@/stores/auth';

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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Loader2, User, CreditCard, FileText, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const PAYMENTS_PER_PAGE = 10;

export default function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPaymentWithDetails | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/subscriptions/list');
        const result = await response.json();

        if (response.ok) {
            setPayments(result.payments || []);
        } else {
            throw new Error(result.error || 'Failed to fetch payments');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
        setPayments([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const totalPages = Math.ceil(payments.length / PAYMENTS_PER_PAGE);
  const paginatedPayments = payments.slice(
    (currentPage - 1) * PAYMENTS_PER_PAGE,
    currentPage * PAYMENTS_PER_PAGE
  );

  const handleUpdateStatus = async (paymentId: string, newPaymentStatus: 'completed' | 'failed') => {
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
            await fetchPayments();
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


  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
       case 'pending_verification':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const formatPaymentMethod = (method: string) => {
    if (method === 'mobile_banking') return 'Mobile Banking';
    if (method === 'credit_card') return 'Credit Card';
    return method;
  }

  if (isLoading) {
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
            <CardTitle>Subscription Payments</CardTitle>
            <CardDescription>View all historical subscription payment records.</CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedPayments.length > 0 ? (
            <>
              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPayments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">{payment.profiles?.full_name || 'N/A'}</span>
                                <span className="text-[10px] text-muted-foreground">@{payment.profiles?.username}</span>
                            </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-[10px]">{payment.plans?.name || 'N/A'}</Badge></TableCell>
                        <TableCell className="text-sm font-bold">৳{payment.amount.toFixed(2)}</TableCell>
                        <TableCell className="font-mono text-xs">{payment.transaction_id || 'N/A'}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{format(new Date(payment.created_at), 'PP')}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(payment.status)} className="text-[10px] h-5">{payment.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)} className="h-8 text-xs">
                            <Eye className="mr-2 h-3 w-3" /> Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Mobile View: Cards */}
              <div className="grid gap-4 md:hidden">
                {paginatedPayments.map(payment => (
                  <Card key={payment.id} onClick={() => setSelectedPayment(payment)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{payment.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-sm font-bold">{payment.profiles?.full_name || 'N/A'}</CardTitle>
                                    <CardDescription className="text-xs">@{payment.profiles?.username || 'unknown'}</CardDescription>
                                </div>
                            </div>
                             <Badge variant={getStatusBadgeVariant(payment.status)} className="text-[10px] h-fit">{payment.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex justify-between items-center">
                          <div className="space-y-1">
                            <Badge variant="secondary" className="text-[10px]">{payment.plans?.name || 'N/A'}</Badge>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(payment.created_at), 'PP')}</p>
                          </div>
                          <p className="font-bold text-base">৳{payment.amount.toFixed(2)}</p>
                      </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No payment records found.</p>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
            <CardFooter className="justify-center pt-6">
                <div className="flex items-center gap-4 text-sm">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>

      {/* Custom Review Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isActionLoading && setSelectedPayment(null)} />
            <div className="relative w-full max-w-lg bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold">Review Payment</h2>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setSelectedPayment(null)} disabled={isActionLoading}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="space-y-6">
                        <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                            <h4 className="font-bold flex items-center gap-2 text-primary text-sm uppercase tracking-widest"><User className="h-4 w-4" /> Admin Info</h4>
                            <div className="grid gap-1">
                                <p className="font-bold">{selectedPayment.profiles?.full_name}</p>
                                <p className="text-xs text-muted-foreground">@{selectedPayment.profiles?.username}</p>
                                <p className="text-xs text-muted-foreground">{(selectedPayment.profiles as any)?.email}</p>
                            </div>
                        </div>
                        <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                            <h4 className="font-bold flex items-center gap-2 text-primary text-sm uppercase tracking-widest"><FileText className="h-4 w-4" /> Plan & Amount</h4>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{selectedPayment.plans?.name}</span>
                                <span className="text-lg font-black">৳{selectedPayment.amount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                            <h4 className="font-bold flex items-center gap-2 text-primary text-sm uppercase tracking-widest"><CreditCard className="h-4 w-4" /> Transaction</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <label className="text-muted-foreground block mb-1">Method</label>
                                    <p className="font-semibold">{formatPaymentMethod(selectedPayment.payment_method)}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block mb-1">Transaction ID</label>
                                    <p className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded w-fit">{selectedPayment.transaction_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block mb-1">Current Status</label>
                                    <Badge variant={getStatusBadgeVariant(selectedPayment.status)}>{selectedPayment.status}</Badge>
                                </div>
                                <div>
                                    <label className="text-muted-foreground block mb-1">Submitted On</label>
                                    <p>{format(new Date(selectedPayment.created_at), 'PPpp')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 border-t flex flex-col sm:flex-row gap-3 shrink-0">
                    <div className="grid grid-cols-2 gap-3 w-full">
                        <Button 
                            onClick={() => handleUpdateStatus(selectedPayment.id.toString(), 'completed')} 
                            disabled={isActionLoading || selectedPayment.status === 'completed'}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20"
                        >
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Approve
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={() => handleUpdateStatus(selectedPayment.id.toString(), 'failed')} 
                            disabled={isActionLoading || selectedPayment.status === 'failed'}
                            className="shadow-lg shadow-destructive/20"
                        >
                            {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                            Reject
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedPayment(null)} disabled={isActionLoading} className="w-full sm:w-auto">Cancel</Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
