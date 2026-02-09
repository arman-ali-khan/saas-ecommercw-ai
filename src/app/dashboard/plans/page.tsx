'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { supabase } from '@/lib/supabase/client';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type Plan } from '@/types';
import { cn } from '@/lib/utils';

const planSchema = z.object({
  id: z
    .string()
    .min(1, "ID is required. Use a short, lowercase name like 'pro' or 'starter'."),
  name: z.string().min(1, 'Plan name is required'),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().min(0, "Price must be a non-negative number.")
  ),
  period: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  features: z.string().min(1, 'Please list at least one feature.'),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function PlansAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
        price: 0,
    }
  });

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching plans',
          description: error.message,
        });
      } else {
        setPlans(data as Plan[]);
      }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedPlan) {
        form.reset({
          ...selectedPlan,
          price: selectedPlan.price,
          features: selectedPlan.features.join('\n'),
          period: selectedPlan.period || '',
        });
      } else {
        form.reset({
          id: '',
          name: '',
          price: 0,
          period: '/মাস',
          description: '',
          features: '',
        });
      }
    }
  }, [isFormOpen, selectedPlan, form]);

  const onSubmit = async (data: PlanFormData) => {
    setIsSubmitting(true);
    try {
      const planPayload = {
        ...data,
        price: data.price,
        period: data.period || null,
        features: data.features.split('\n').filter((f) => f.trim() !== ''),
      };

      let error;

      if (selectedPlan && selectedPlan.id) {
        // Update
        const { error: updateError } = await supabase
          .from('plans')
          .update(planPayload)
          .eq('id', selectedPlan.id);
        error = updateError;
        if (!error) toast({ title: 'Plan Updated' });
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('plans')
          .insert(planPayload);
        error = insertError;
        if (!error) toast({ title: 'Plan Created' });
      }

      if (error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: error.message,
        });
      } else {
        await fetchPlans();
        setIsFormOpen(false);
        setSelectedPlan(null);
      }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
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
      const { error } = await supabase.from('plans').delete().eq('id', selectedPlan.id);

      if (error) {
        toast({
          title: 'Error Deleting Plan',
          variant: 'destructive',
          description: error.message,
        });
      } else {
        toast({ title: 'Plan Deleted' });
        await fetchPlans();
      }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
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
                  <TableHead>Price</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      {plan.price === 0 ? 'বিনামূল্যে' : `৳ ${plan.price.toFixed(2)}`}{' '}
                      {plan.period}
                    </TableCell>
                    <TableCell>{plan.description}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openForm(plan)}
                        className="mr-2"
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
                <CardContent className="flex-grow">
                  <p className="font-semibold text-xl">
                    {plan.price === 0 ? 'বিনামূল্যে' : `৳ ${plan.price.toFixed(2)}`}{' '}
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </p>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? 'Edit Plan' : 'Add New Plan'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan ID</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., pro"
                        {...field}
                        disabled={!!selectedPlan}
                      />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="e.g., Pro" {...field} />
                    </FormControl>
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
                      <FormControl>
                        <Input
                          type="number"
                          step="1"
                          placeholder="e.g., 999"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., /মাস" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A short description of the plan"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Features</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List features, one per line..."
                        {...field}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save Plan'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {selectedPlan?.name} plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(buttonVariants({ variant: 'destructive' }))}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
