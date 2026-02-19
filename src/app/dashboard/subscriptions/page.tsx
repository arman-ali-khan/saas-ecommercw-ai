
'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Loader2, User, CreditCard, FileText, Anchor } from 'lucide-react';
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

  const handleUpdateStatus = async (payment: SubscriptionPaymentWithDetails, newPaymentStatus: 'completed' | 'failed') => {
    setIsActionLoading(true);
    try {
        const { error: paymentError } = await supabase
            .from('subscription_payments')
            .update({ status: newPaymentStatus })
            .eq('id', payment.id);
        
        if (paymentError) throw paymentError;
        
        let profileUpdate = {};
        if (newPaymentStatus === 'completed') {
            profileUpdate = { 
                subscription_status: 'active',
                subscription_plan: payment.plan_id
            };
        } else { // 'failed'
             profileUpdate = { 
                subscription_status: 'inactive'
            };
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update(profileUpdate)
            .eq('id', payment.user_id);
            
        if (profileError) throw profileError;
        
        toast({ title: 'Success', description: `Payment reviewed and status updated.` });
        fetchPayments();
        setSelectedPayment(null);

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
              <div className="hidden md:block">
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
                                <span className="font-bold">{payment.profiles?.full_name || 'N/A'}</span>
                                <span className="text-[10px] text-muted-foreground">@{payment.profiles?.username}</span>
                            </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{payment.plans?.name || 'N/A'}</Badge></TableCell>
                        <TableCell>{payment.amount.toFixed(2)} BDT</TableCell>
                        <TableCell className="font-mono text-xs">{payment.transaction_id || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{format(new Date(payment.created_at), 'PP')}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)}>
                            <Eye className="mr-2 h-4 w-4" /> Review
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
                  <Card key={payment.id} onClick={() => setSelectedPayment(payment)} className="cursor-pointer hover:bg-muted/50">
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
                          <p className="font-bold text-base">{payment.amount.toFixed(2)} BDT</p>
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

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Payment</DialogTitle>
            <DialogDescription>
                Review and approve or reject transaction #{selectedPayment?.transaction_id || selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <>
                <div className="space-y-4 py-4 text-sm">
                    <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> User Information</h4>
                        <p><strong>Name:</strong> {selectedPayment.profiles?.full_name}</p>
                        <p><strong>Username:</strong> @{selectedPayment.profiles?.username}</p>
                        <p><strong>Email:</strong> {(selectedPayment.profiles as any)?.email}</p>
                    </div>
                    <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Subscription Details</h4>
                        <p><strong>Plan:</strong> {selectedPayment.plans?.name}</p>
                        <p><strong>Amount:</strong> {selectedPayment.amount.toFixed(2)} BDT</p>
                    </div>
                    <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
                        <h4 className="font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Information</h4>
                        <p><strong>Method:</strong> {formatPaymentMethod(selectedPayment.payment_method)}</p>
                        <p><strong>Transaction ID:</strong> {selectedPayment.transaction_id || 'N/A'}</p>
                        <div className="flex items-center gap-2">
                            <strong>Status:</strong>
                            <Badge variant={getStatusBadgeVariant(selectedPayment.status)}>{selectedPayment.status}</Badge>
                        </div>
                        <p><strong>Date:</strong> {format(new Date(selectedPayment.created_at), 'PPpp')}</p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-between pt-4 gap-2">
                    <div className="flex gap-2">
                        <Button onClick={() => handleUpdateStatus(selectedPayment, 'completed')} disabled={isActionLoading || selectedPayment.status === 'completed'}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve
                        </Button>
                        <Button variant="destructive" onClick={() => handleUpdateStatus(selectedPayment, 'failed')} disabled={isActionLoading || selectedPayment.status === 'failed'}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedPayment(null)}>Close</Button>
                </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
