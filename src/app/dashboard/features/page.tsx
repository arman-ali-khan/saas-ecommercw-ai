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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type SaasFeature } from '@/types';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const featureSchema = z.object({
  name: z.string().min(1, "Feature name is required."),
  description: z.string().optional(),
  icon: z.string().min(1, "An icon is required."),
});

type FeatureFormData = z.infer<typeof featureSchema>;

export default function FeaturesAdminPage() {
  const [features, setFeatures] = useState<SaasFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<SaasFeature | null>(null);
  const { toast } = useToast();

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: 'Sparkles',
    },
  });

  const fetchFeatures = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('saas_features')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching features',
          description: error.message,
        });
      } else {
        setFeatures(data as SaasFeature[]);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedFeature) {
        form.reset({
          name: selectedFeature.name,
          description: selectedFeature.description || '',
          icon: selectedFeature.icon,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          icon: 'Sparkles',
        });
      }
    }
  }, [isFormOpen, selectedFeature, form]);

  const onSubmit = async (data: FeatureFormData) => {
    setIsSubmitting(true);
    try {
      let error;
      if (selectedFeature) {
        const { error: updateError } = await supabase
          .from('saas_features')
          .update(data)
          .eq('id', selectedFeature.id);
        error = updateError;
        if (!error) toast({ title: 'Feature Updated' });
      } else {
        const { error: insertError } = await supabase.from('saas_features').insert(data);
        error = insertError;
        if (!error) toast({ title: 'Feature Created' });
      }

      if (error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: error.message,
        });
      } else {
        await fetchFeatures();
        setIsFormOpen(false);
        setSelectedFeature(null);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openForm = (feature: SaasFeature | null) => {
    setSelectedFeature(feature);
    setIsFormOpen(true);
  };

  const openDeleteAlert = (feature: SaasFeature) => {
    setSelectedFeature(feature);
    setIsAlertOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedFeature) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('saas_features').delete().eq('id', selectedFeature.id);

      if (error) {
        toast({
          title: 'Error Deleting Feature',
          variant: 'destructive',
          description: error.message,
        });
      } else {
        toast({ title: 'Feature Deleted' });
        await fetchFeatures();
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'An unexpected error occurred', description: e.message });
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
      setSelectedFeature(null);
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
            <CardTitle>Feature Manager</CardTitle>
            <CardDescription>
              Manage features available for subscription plans.
            </CardDescription>
          </div>
          <Button onClick={() => openForm(null)}>
            <Plus className="mr-2 h-4 w-4" /> Add Feature
          </Button>
        </CardHeader>
        <CardContent>
          {features.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
                <p>No features have been created yet.</p>
                <Button className="mt-4" onClick={() => openForm(null)}>
                    <Plus className="mr-2 h-4 w-4" /> Add your first feature
                </Button>
            </div>
          ) : (
            <>
                {/* Desktop View: Table */}
                <div className="hidden md:block">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Icon</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {features.map((feature) => (
                        <TableRow key={feature.id}>
                        <TableCell>
                            <DynamicIcon name={feature.icon} className="h-6 w-6 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">{feature.name}</TableCell>
                        <TableCell>{feature.description}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => openForm(feature)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => openDeleteAlert(feature)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </div>
                {/* Mobile View */}
                <div className="grid gap-4 md:hidden">
                    {features.map(feature => (
                        <Card key={feature.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <DynamicIcon name={feature.icon} className="h-6 w-6" />
                                        <CardTitle>{feature.name}</CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="-mt-2 -mr-2">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openForm(feature)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteAlert(feature)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            {feature.description && (
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedFeature ? 'Edit Feature' : 'Add New Feature'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Unlimited Products" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what this feature does." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <IconPicker value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormDescription>The selected icon is: <span className="font-bold">{field.value}</span></FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Feature
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
              This action cannot be undone. This will permanently delete the feature "{selectedFeature?.name}".
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
