'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import type { SubscriptionPaymentWithDetails } from '@/types';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Loader2, User, CreditCard, FileText } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function SubscriptionPaymentsPage() {
  const [payments, setPayments] = useState<SubscriptionPaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<SubscriptionPaymentWithDetails | null>(null);
  const { toast } = useToast();

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('subscription_payments')
      .select('*, profiles(full_name, username), plans(name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error fetching subscription payments',
        description: error.message,
      });
    } else {
      setPayments(data as SubscriptionPaymentWithDetails[]);
    }
    setIsLoading(false);
  }, [toast]);
  
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);


  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'pending':
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
                      <TableHead>Method</TableHead>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.profiles?.full_name || 'N/A'}</TableCell>
                        <TableCell><Badge variant="secondary">{payment.plans?.name || 'N/A'}</Badge></TableCell>
                        <TableCell>{payment.amount.toFixed(2)} BDT</TableCell>
                        <TableCell>
                           {formatPaymentMethod(payment.payment_method)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{payment.transaction_id || 'N/A'}</TableCell>
                        <TableCell>{format(new Date(payment.created_at), 'PPP')}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedPayment(payment)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
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
                            <p className="font-semibold text-lg">{payment.amount.toFixed(2)} BDT</p>
                        </div>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center pt-0">
                          <Badge variant="secondary">{payment.plans?.name || 'N/A'}</Badge>
                          <p className="text-sm text-muted-foreground">{format(new Date(payment.created_at), 'PPP')}</p>
                      </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-8">No payment records found.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
                Full details for transaction #{selectedPayment?.transaction_id || selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
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
                    <p><strong>Status:</strong> <Badge variant={getStatusBadgeVariant(selectedPayment.status)}>{selectedPayment.status}</Badge></p>
                    <p><strong>Date:</strong> {format(new Date(selectedPayment.created_at), 'PPpp')}</p>
                </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
