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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const planSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, 'Plan name is required'),
  name_en: z.string().optional(),
  price: z.coerce.number().min(0),
  period: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  description_en: z.string().optional(),
  features: z.string().min(1, 'Features required'),
  features_en: z.string().optional(),
  product_limit: z.string().optional(),
  customer_limit: z.string().optional(),
  order_limit: z.string().optional(),
  duration_value: z.coerce.number().min(1),
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
        id: '', name: '', name_en: '', price: 0, period: '/মাস', description: '', description_en: '', features: '', features_en: '',
        product_limit: '', customer_limit: '', order_limit: '', duration_value: 1, duration_unit: 'month',
    }
  });

  const fetchPlans = useCallback(async (force = false) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saas/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'plans' }),
      });
      const result = await response.json();
      if (response.ok) setPlans(result.data as Plan[]);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [setPlans, toast]);

  useEffect(() => { if (user) fetchPlans(); }, [fetchPlans, user]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedPlan) {
        form.reset({
          ...selectedPlan,
          name_en: (selectedPlan as any).name_en || '',
          description_en: (selectedPlan as any).description_en || '',
          features: selectedPlan.features.join('\n'),
          features_en: (selectedPlan as any).features_en?.join('\n') || '',
          product_limit: selectedPlan.product_limit?.toString() ?? '',
          customer_limit: selectedPlan.customer_limit?.toString() ?? '',
          order_limit: selectedPlan.order_limit?.toString() ?? '',
        });
      } else {
        form.reset({ id: '', name: '', name_en: '', price: 0, period: '/মাস', description: '', description_en: '', features: '', features_en: '', product_limit: '', customer_limit: '', order_limit: '', duration_value: 1, duration_unit: 'month' });
      }
    }
  }, [isFormOpen, selectedPlan, form]);

  const onSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        features: data.features.split('\n').filter(f => f.trim()),
        features_en: data.features_en?.split('\n').filter(f => f.trim()) || [],
        product_limit: data.product_limit ? parseInt(data.product_limit) : null,
        customer_limit: data.customer_limit ? parseInt(data.customer_limit) : null,
        order_limit: data.order_limit ? parseInt(data.order_limit) : null,
      };

      const response = await fetch('/api/saas/plans/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({ title: 'Success' });
        await fetchPlans(true);
        setIsFormOpen(false);
      }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForm = (plan: Plan | null) => { setSelectedPlan(plan); setIsFormOpen(true); };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Plan Manager</CardTitle><CardDescription>Bilingual subscription plan management.</CardDescription></div>
          <Button onClick={() => openForm(null)}><Plus className="mr-2 h-4 w-4" /> Add Plan</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name (BN/EN)</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div className="font-bold">{plan.name}</div>
                    <div className="text-xs text-muted-foreground">{(plan as any).name_en || 'No EN Name'}</div>
                  </TableCell>
                  <TableCell>৳{plan.price}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openForm(plan)}><Edit className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
            <div className="relative w-full max-w-2xl bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Manage Plan</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}><X /></Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField control={form.control} name="id" render={({ field }) => (<FormItem><FormLabel>Plan ID</FormLabel><FormControl><Input {...field} disabled={!!selectedPlan} /></FormControl></FormItem>)} />
                            <Tabs defaultValue="bn">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="bn">Bengali</TabsTrigger>
                                    <TabsTrigger value="en">English</TabsTrigger>
                                </TabsList>
                                <TabsContent value="bn" className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name (BN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Desc (BN)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="features" render={({ field }) => (<FormItem><FormLabel>Features (BN)</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl></FormItem>)} />
                                </TabsContent>
                                <TabsContent value="en" className="space-y-4">
                                    <FormField control={form.control} name="name_en" render={({ field }) => (<FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="description_en" render={({ field }) => (<FormItem><FormLabel>Desc (EN)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="features_en" render={({ field }) => (<FormItem><FormLabel>Features (EN)</FormLabel><FormControl><Textarea rows={5} {...field} /></FormControl></FormItem>)} />
                                </TabsContent>
                            </Tabs>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel>Price</FormLabel><Input type="number" {...field} /></FormItem>)} />
                                <FormField control={form.control} name="period" render={({ field }) => (<FormItem><FormLabel>Period Label</FormLabel><Input {...field} /></FormItem>)} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save Plan</Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
      )}
    </>
  );
}