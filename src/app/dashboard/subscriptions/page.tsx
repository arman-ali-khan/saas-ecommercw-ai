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
import { Eye, Loader2, User, CreditCard, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPaymentWithDetails | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const fetchPayments = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
        const { data: paymentsData, error: paymentsError } = await supabase
        .from('subscription_payments')
        .select('*')
        .order('created_at', { ascending: false });

        if (paymentsError) {
            toast({
                variant: 'destructive',
                title: 'Error Fetching Subscription Payments',
                description: `Could not load payment data. Error: ${paymentsError.message}`,
                duration: 10000,
            });
            console.error("Subscription Payments fetch error:", paymentsError);
            setPayments([]);
            return;
        }
        
        if (!paymentsData || paymentsData.length === 0) {
            setPayments([]);
            setIsLoading(false);
            return;
        }

        const userIds = [...new Set(paymentsData.map(p => p.user_id))];
        const planIds = [...new Set(paymentsData.map(p => p.plan_id).filter(Boolean))];

        const profilesPromise = userIds.length > 0 ? supabase.from('profiles').select('id, full_name, username').in('id', userIds) : Promise.resolve({ data: [], error: null });
        const plansPromise = planIds.length > 0 ? supabase.from('plans').select('id, name').in('id', planIds) : Promise.resolve({ data: [], error: null });
        
        const [
            { data: profilesData, error: profilesError },
            { data: plansData, error: plansError }
        ] = await Promise.all([profilesPromise, plansPromise]);


        if (profilesError || plansError) {
            const description = profilesError?.message || plansError?.message || 'Could not fetch related data.';
            toast({
                variant: 'destructive',
                title: 'Error Fetching Subscription Details',
                description: `Could not load user or plan details. ${description}`,
                duration: 10000,
            });
        }

        const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));
        const plansMap = new Map((plansData || []).map(p => [p.id, p]));

        const combinedData = paymentsData.map(payment => ({
            ...payment,
            profiles: profilesMap.get(payment.user_id) || null,
            plans: payment.plan_id ? plansMap.get(payment.plan_id) || null : null,
        }));

        setPayments(combinedData as SubscriptionPaymentWithDetails[]);
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'An unexpected client error occurred', description: e.message });
        setPayments([]);
    } finally {
        setIsLoading(false);
    }
  }, [toast, user]);
  
  useEffect(() => {
    if (!authLoading) {
        fetchPayments();
    }
  }, [authLoading, fetchPayments]);

  const handleUpdateStatus = async (payment: SubscriptionPaymentWithDetails, newPaymentStatus: 'completed' | 'failed', newProfileStatus: 'active' | 'inactive') => {
    setIsActionLoading(true);
    try {
        const { error: paymentError } = await supabase
            .from('subscription_payments')
            .update({ status: newPaymentStatus })
            .eq('id', payment.id);
        
        if (paymentError) throw paymentError;

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ subscription_status: newProfileStatus })
            .eq('id', payment.user_id);
            
        if (profileError) throw profileError;
        
        toast({ title: 'Success', description: `Payment marked as ${newPaymentStatus} and user set to ${newProfileStatus}.` });
        fetchPayments(); // Refresh data
        setSelectedPayment(null); // Close dialog

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
          {payments.length > 0 ? (
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
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.profiles?.full_name || 'N/A'}</TableCell>
                        <TableCell><Badge variant="secondary">{payment.plans?.name || 'N/A'}</Badge></TableCell>
                        <TableCell>{payment.amount.toFixed(2)} BDT</TableCell>
                        <TableCell className="font-mono text-xs">{payment.transaction_id || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(payment.created_at), 'PPP')}</TableCell>
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
                {payments.map(payment => (
                  <Card key={payment.id} onClick={() => setSelectedPayment(payment)} className="cursor-pointer hover:bg-muted/50">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarFallback>{payment.profiles?.full_name?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{payment.profiles?.full_name || 'N/A'}</CardTitle>
                                    <CardDescription>@{payment.profiles?.username || 'unknown'}</CardDescription>
                                </div>
                            </div>
                             <Badge variant={getStatusBadgeVariant(payment.status)}>{payment.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center">
                          <div className="space-y-1">
                            <Badge variant="secondary">{payment.plans?.name || 'N/A'}</Badge>
                            <p className="text-sm text-muted-foreground">{format(new Date(payment.created_at), 'PP')}</p>
                          </div>
                          <p className="font-semibold text-lg">{payment.amount.toFixed(2)} BDT</p>
                      </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No payment records found.</p>
              <p className="text-xs text-muted-foreground mt-2">If you have just added the security policies, please try refreshing the page.</p>
            </div>
          )}
        </CardContent>
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
                        <Button onClick={() => handleUpdateStatus(selectedPayment, 'completed', 'active')} disabled={isActionLoading || selectedPayment.status === 'completed'}>
                            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve
                        </Button>
                        <Button variant="destructive" onClick={() => handleUpdateStatus(selectedPayment, 'failed', 'inactive')} disabled={isActionLoading || selectedPayment.status === 'failed'}>
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
