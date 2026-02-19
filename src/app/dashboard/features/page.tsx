'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, MoreHorizontal, X, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type SaasFeature } from '@/types';
import { cn } from '@/lib/utils';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';

const featureSchema = z.object({
  name: z.string().min(1, "Feature name is required."),
  description: z.string().optional(),
  icon: z.string().min(1, "An icon is required."),
});

type FeatureFormData = z.infer<typeof featureSchema>;

export default function FeaturesAdminPage() {
  const { user } = useAuth();
  const { features, setFeatures } = useSaasStore();
  const [isLoading, setIsLoading] = useState(!features.length);
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

  const fetchFeatures = useCallback(async (force = false) => {
    const store = useSaasStore.getState();
    const isFresh = Date.now() - store.lastFetched.features < 3600000;
    if (!force && store.features.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/saas/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'features' }),
      });
      const result = await response.json();
      if (response.ok) {
        setFeatures(result.data as SaasFeature[]);
      } else {
        throw new Error(result.error || 'Failed to fetch features');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error fetching features', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [setFeatures, toast]);

  useEffect(() => {
    if (user) {
      fetchFeatures();
    }
  }, [fetchFeatures, user]);

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
      const response = await fetch('/api/saas/features/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: selectedFeature?.id }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({ title: selectedFeature ? 'Feature Updated' : 'Feature Created' });
        await fetchFeatures(true);
        setIsFormOpen(false);
        setSelectedFeature(null);
      } else {
        throw new Error(result.error || 'Failed to save feature');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
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
      const response = await fetch('/api/saas/features/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedFeature.id }),
      });

      if (response.ok) {
        toast({ title: 'Feature Deleted' });
        await fetchFeatures(true);
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete feature');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
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

      {/* Custom Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsFormOpen(false)} />
            <div className="relative w-full max-w-xl bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-6 border-b flex justify-between items-center shrink-0">
                    <h2 className="text-xl font-bold">{selectedFeature ? 'Edit Feature' : 'Add New Feature'}</h2>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Feature Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., Unlimited Products" {...field} /></FormControl>
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
                                    <FormControl><Textarea placeholder="Describe what this feature does." {...field} /></FormControl>
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
                                    <FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl>
                                    <FormDescription>Selected icon: <span className="font-bold">{field.value}</span></FormDescription>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </div>
                <div className="p-6 border-t flex justify-end gap-3 shrink-0">
                    <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Feature
                    </Button>
                </div>
            </div>
        </div>
      )}

      {/* Custom Delete Modal */}
      {isAlertOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setIsAlertOpen(false)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-foreground">Are you absolutely sure?</h3>
                </div>
                <div className="mb-8"><p className="text-muted-foreground leading-relaxed">This action cannot be undone. This will permanently delete the feature "{selectedFeature?.name}".</p></div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAlertOpen(false)} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
