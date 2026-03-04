'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { type SaasFeature } from '@/types';
import IconPicker from '@/components/icon-picker';
import DynamicIcon from '@/components/dynamic-icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';
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
import { cn } from '@/lib/utils';

const featureSchema = z.object({
  name: z.string().min(1, "Name required"),
  name_en: z.string().optional(),
  description: z.string().optional(),
  description_en: z.string().optional(),
  icon: z.string().min(1, "Icon required"),
});

type FeatureFormData = z.infer<typeof featureSchema>;

export default function FeaturesAdminPage() {
  const { user } = useAuth();
  const { features, setFeatures } = useSaasStore();
  const [isLoading, setIsLoading] = useState(!features.length);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<SaasFeature | null>(null);
  const { toast } = useToast();

  const form = useForm<FeatureFormData>({
    resolver: zodResolver(featureSchema),
    defaultValues: { name: '', name_en: '', description: '', description_en: '', icon: 'Sparkles' },
  });

  const fetchFeatures = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/saas/fetch-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'features' }),
      });
      const result = await response.json();
      if (response.ok) setFeatures(result.data as SaasFeature[]);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }, [setFeatures, toast]);

  useEffect(() => { if (user) fetchFeatures(); }, [fetchFeatures, user]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedFeature) {
        form.reset({
          name: selectedFeature.name,
          name_en: (selectedFeature as any).name_en || '',
          description: selectedFeature.description || '',
          description_en: (selectedFeature as any).description_en || '',
          icon: selectedFeature.icon,
        });
      } else {
        form.reset({ name: '', name_en: '', description: '', description_en: '', icon: 'Sparkles' });
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
      if (response.ok) {
        toast({ title: 'Success' });
        await fetchFeatures();
        setIsFormOpen(false);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeature) return;
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/saas/features/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedFeature.id }),
      });
      if (response.ok) {
        toast({ title: 'Feature Deleted' });
        await fetchFeatures();
        setIsDeleteAlertOpen(false);
        setSelectedFeature(null);
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Platform Features</CardTitle><CardDescription>Manage bilingual platform features.</CardDescription></div>
          <Button onClick={() => { setSelectedFeature(null); setIsFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Feature</Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Icon</TableHead><TableHead>Name (BN/EN)</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {features.map((f) => (
                <TableRow key={f.id}>
                  <TableCell><DynamicIcon name={f.icon} className="h-5 w-5" /></TableCell>
                  <TableCell>
                    <div className="font-bold">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{(f as any).name_en || 'No EN Name'}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedFeature(f); setIsFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => { setSelectedFeature(f); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
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
            <div className="relative w-full max-w-xl bg-background rounded-xl shadow-2xl border flex flex-col max-h-[90vh]">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Feature Details</h2>
                    <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}><X /></Button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <Tabs defaultValue="bn">
                                <TabsList className="mb-4">
                                    <TabsTrigger value="bn">BN</TabsTrigger>
                                    <TabsTrigger value="en">EN</TabsTrigger>
                                </TabsList>
                                <TabsContent value="bn" className="space-y-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name (BN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Desc (BN)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                </TabsContent>
                                <TabsContent value="en" className="space-y-4">
                                    <FormField control={form.control} name="name_en" render={({ field }) => (<FormItem><FormLabel>Name (EN)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={form.control} name="description_en" render={({ field }) => (<FormItem><FormLabel>Desc (EN)</FormLabel><FormControl><Textarea {...field} /></FormControl></FormItem>)} />
                                </TabsContent>
                            </Tabs>
                            <FormField control={form.control} name="icon" render={({ field }) => (<FormItem><FormLabel>Icon</FormLabel><FormControl><IconPicker value={field.value} onChange={field.onChange} /></FormControl></FormItem>)} />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin mr-2" />} Save Feature</Button>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the feature <span className="font-bold text-foreground">"{selectedFeature?.name}"</span>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={isActionLoading}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete Feature
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
