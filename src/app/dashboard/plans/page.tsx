'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, X, AlertTriangle, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type Plan } from '@/types';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const planSchema = z.object({
  id: z
    .string()
    .min(1, "ID is required. Use a short, lowercase name like 'pro' or 'starter'."),
  name: z.string().min(1, 'Plan name is required'),
  price: z.coerce.number().min(0, "Price must be a non-negative number."),
  period: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  features: z.string().min(1, 'Please list at least one feature.'),
  product_limit: z.string().regex(/^\d*$/, "Must be a positive number").optional(),
  customer_limit: z.string().regex(/^\d*$/, "Must be a positive number").optional(),
  order_limit: z.string().regex(/^\d*$/, "Must be a positive number").optional(),
  duration_value: z.coerce.number().min(1, "Duration must be at least 1"),
  duration_unit: z.enum(['month', 'year']),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function PlansAdminPage() {
  const { user } = useAuth();
  const { plans, setPlans } = useSaasStore();
  const [isLoading, setIsLoading] = useState(!plans.length);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
        id: '',
        name: '',
        price: 0,
        period: '/মাস',
        description: '',
        features: '',
        product_limit: '',
        customer_limit: '',
        order_limit: '',
        duration_value: 1,
        duration_unit: 'month',
    }
  });

  const fetchPlans = useCallback(async (force = false) => {
    const store = useSaasStore.getState();
    const isFresh = Date.now() - store.lastFetched.plans < 3600000;
    if (!force && store.features.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/saas/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'plans' }),
      });
      const result = await response.json();
      if (response.ok) {
        setPlans(result.data as Plan[]);
      } else {
        throw new Error(result.error || 'Failed to fetch plans');
      }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error fetching plans', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [setPlans, toast]);

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [fetchPlans, user]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedPlan) {
        form.reset({
          ...selectedPlan,
          price: selectedPlan.price,
          features: selectedPlan.features.join('\n'),
          period: selectedPlan.period || '',
          product_limit: selectedPlan.product_limit?.toString() ?? '',
          customer_limit: selectedPlan.customer_limit?.toString() ?? '',
          order_limit: selectedPlan.order_limit?.toString() ?? '',
          duration_value: selectedPlan.duration_value ?? 1,
          duration_unit: (selectedPlan.duration_unit as any) || 'month',
        });
      } else {
        form.reset({
          id: '',
          name: '',
          price: 0,
          period: '/মাস',
          description: '',
          features: '',
          product_limit: '',
          customer_limit: '',
          order_limit: '',
          duration_value: 1,
          duration_unit: 'month',
        });
      }
    }
  }, [isFormOpen, selectedPlan, form]);

  const onSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      const planPayload = {
        id: data.id,
        name: data.name,
        price: data.price,
        period: data.period || null,
        description: data.description,
        features: data.features.split('\n').filter((f) => f.trim() !== ''),
        product_limit: data.product_limit && data.product_limit.trim() !== '' ? parseInt(data.product_limit, 10) : null,
        customer_limit: data.customer_limit && data.customer_limit.trim() !== '' ? parseInt(data.customer_limit, 10) : null,
        order_limit: data.order_limit && data.order_limit.trim() !== '' ? parseInt(data.order_limit, 10) : null,
        duration_value: data.duration_value,
        duration_unit: data.duration_unit,
      };

      const response = await fetch('/api/saas/plans/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planPayload),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: selectedPlan ? 'Plan Updated' : 'Plan Created' });
        await fetchPlans(true);
        setIsFormOpen(false);
        setSelectedPlan(null);
      } else {
        throw new Error(result.error || 'Failed to save plan');
      }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForm = (plan: Plan | null) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const openDeleteAlert = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedPlan) return;
    setIsDeleting(true);
    try {
      const response = await fetch('/api/saas/plans/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedPlan.id }),
      });

      if (response.ok) {
        toast({ title: 'Plan Deleted' });
        await fetchPlans(true);
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete plan');
      }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
      setSelectedPlan(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-28" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subscription Plan Manager</CardTitle>
            <CardDescription>
              View, create, edit, and manage all subscription plans.
            </CardDescription>
          </div>
          <Button onClick={() => openForm(null)}>
            <Plus className="mr-2 h-4 w-4" /> Add Plan
          </Button>
        </CardHeader>
        <CardContent>
          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Price & Validity</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <div>
                        {plan.price === 0 ? 'বিনামূল্যে' : `৳ ${plan.price.toFixed(2)}`}{' '}
                        {plan.period}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" /> 
                        Duration: {plan.duration_value} {plan.duration_unit}(s)
                      </div>
                    </TableCell>
                    <TableCell>
                        <ul className="text-xs list-disc list-inside">
                            <li>Products: {plan.product_limit ?? 'Unlimited'}</li>
                            <li>Customers: {plan.customer_limit ?? 'Unlimited'}</li>
                            <li>Orders: {plan.order_limit ?? 'Unlimited'}/mo</li>
                        </ul>
                    </TableCell>
                    <TableCell className="text-xs">{plan.description}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openForm(plan)}
                        className="mr-2"
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDeleteAlert(plan)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View: Cards */}
          <div className="grid gap-4 md:hidden">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="font-semibold text-xl">
                        {plan.price === 0 ? 'বিনামূল্যে' : `৳ ${plan.price.toFixed(2)}`}{' '}
                        <span className="text-sm text-muted-foreground">
                        {plan.period}
                        </span>
                    </p>
                    <Badge variant="outline" className="gap-1">
                        <Calendar className="h-3 w-3" /> {plan.duration_value} {plan.duration_unit}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <h4 className="font-semibold text-foreground mb-1">Limits:</h4>
                     <ul className="list-disc list-inside">
                        <li>Products: {plan.product_limit ?? 'Unlimited'}</li>
                        <li>Customers: {plan.customer_limit ?? 'Unlimited'}</li>
                        <li>Orders: {plan.order_limit ?? 'Unlimited'}/mo</li>
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openForm(plan)}
                  >
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteAlert(plan)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsFormOpen(false)} />
            <div className="relative w-full max-w-xl bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold">{selectedPlan ? 'Edit Plan' : 'Add New Plan'}</h2>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="id"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan ID</FormLabel>
                                    <FormControl><Input placeholder="e.g., pro" {...field} disabled={!!selectedPlan} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plan Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Pro" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price (BDT)</FormLabel>
                                        <FormControl><Input type="number" step="1" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="period"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price Period Label (optional)</FormLabel>
                                        <FormControl><Input placeholder="e.g., /মাস" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>

                            <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-widest"><Calendar className="h-4 w-4" /> Validity Duration</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="duration_value"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Duration Value</FormLabel>
                                            <FormControl><Input type="number" min="1" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="duration_unit"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unit</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select unit" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="z-[110]">
                                                    <SelectItem value="month">Month(s)</SelectItem>
                                                    <SelectItem value="year">Year(s)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">This duration will be used to calculate the site's end date when a subscription is approved.</p>
                            </div>

                            <div className="space-y-2 rounded-lg border p-4 bg-muted/30">
                                <h3 className="text-sm font-medium">Resource Limits</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="product_limit" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Product Limit</FormLabel><FormControl><Input type="number" min="0" placeholder="Unlimited" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="customer_limit" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Customer Limit</FormLabel><FormControl><Input type="number" min="0" placeholder="Unlimited" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="order_limit" render={({ field }) => (
                                        <FormItem><FormLabel className="text-xs">Order Limit</FormLabel><FormControl><Input type="number" min="0" placeholder="Unlimited" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                </div>
                            </div>
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Short Description</FormLabel><FormControl><Input placeholder="Short description" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="features" render={({ field }) => (
                                <FormItem><FormLabel>Features List (one per line)</FormLabel><FormControl><Textarea placeholder="List features, one per line..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </form>
                    </Form>
                </div>
                <div className="p-6 border-t flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Plan
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setIsAlertOpen(false)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-foreground">Are you absolutely sure?</h3>
                </div>
                <div className="mb-8"><p className="text-muted-foreground leading-relaxed">This action cannot be undone. This will permanently delete the <strong>{selectedPlan?.name}</strong> plan and all associated pricing metadata.</p></div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAlertOpen(false)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Plan
                    </Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
