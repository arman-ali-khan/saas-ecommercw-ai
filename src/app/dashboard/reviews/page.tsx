'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Trash2, Star, X, Edit } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { SaaSReview } from '@/types';
import { useAuth } from '@/stores/auth';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SaasReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<SaaSReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<SaaSReview | null>(null);
  const { toast } = useToast();

  const form = useForm({ defaultValues: { name: '', company: '', rating: 5, review_text: '', review_text_en: '', is_approved: true } });

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'reviews' }),
        });
        const result = await response.json();
        if (response.ok) setReviews(result.data as SaaSReview[]);
    } catch (error: any) { toast({ variant: 'destructive', title: 'Error', description: error.message }); }
    finally { setIsLoading(false); }
  }, [toast]);

  useEffect(() => { if (user) fetchReviews(); }, [fetchReviews, user]);

  useEffect(() => {
    if (isFormOpen && selectedReview) {
        form.reset({
            name: selectedReview.name,
            company: selectedReview.company || '',
            rating: selectedReview.rating,
            review_text: selectedReview.review_text,
            review_text_en: (selectedReview as any).review_text_en || '',
            is_approved: selectedReview.is_approved
        });
    }
  }, [isFormOpen, selectedReview, form]);

  const onSave = async (data: any) => {
    try {
        const response = await fetch('/api/saas/reviews/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, id: selectedReview?.id }),
        });
        if (response.ok) { toast({ title: 'Saved' }); fetchReviews(); setIsFormOpen(false); }
    } catch (e) { toast({ variant: 'destructive', title: 'Error' }); }
  };

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Testimonials</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map(review => (
              <Card key={review.id} className="flex flex-col">
                <CardHeader className="p-4">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm">{review.name}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedReview(review); setIsFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    </div>
                    <Badge variant={review.is_approved ? 'default' : 'secondary'}>{review.is_approved ? 'Approved' : 'Pending'}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-xs italic">BN: {review.review_text}</p>
                    <p className="text-xs italic mt-2 text-primary">EN: {(review as any).review_text_en || 'N/A'}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" onClick={() => setIsFormOpen(false)} />
            <div className="relative w-full max-w-lg bg-background rounded-xl p-6 shadow-2xl space-y-6">
                <h2 className="text-xl font-bold">Edit Review</h2>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><Input {...field} /></FormItem>)} />
                        <Tabs defaultValue="bn">
                            <TabsList><TabsTrigger value="bn">BN</TabsTrigger><TabsTrigger value="en">EN</TabsTrigger></TabsList>
                            <TabsContent value="bn"><FormField control={form.control} name="review_text" render={({ field }) => (<FormItem><FormLabel>Text (BN)</FormLabel><Textarea {...field} /></FormItem>)} /></TabsContent>
                            <TabsContent value="en"><FormField control={form.control} name="review_text_en" render={({ field }) => (<FormItem><FormLabel>Text (EN)</FormLabel><Textarea {...field} /></FormItem>)} /></TabsContent>
                        </Tabs>
                        <Button type="submit" className="w-full">Save Review</Button>
                    </form>
                </Form>
            </div>
        </div>
      )}
    </div>
  );
}