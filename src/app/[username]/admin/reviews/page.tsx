
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2, CheckCircle, Star, Plus, Edit } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ProductReview, Product } from '@/types';

const reviewFormSchema = z.object({
  product_id: z.string().min(1, 'Please select a product.'),
  customer_name: z.string().min(2, 'Customer name is required.'),
  rating: z.number().min(1, 'Please select a rating between 1 and 5.').max(5),
  title: z.string().optional(),
  review_text: z.string().min(10, 'Review must be at least 10 characters.'),
  is_approved: z.boolean().default(true),
});
type ReviewFormData = z.infer<typeof reviewFormSchema>;


export default function ReviewsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Pick<Product, 'id' | 'name'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [reviewToDelete, setReviewToDelete] = useState<ProductReview | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 5,
      is_approved: true,
    },
  });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const reviewsResponse = await fetch('/api/reviews/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: user.id }),
      });
      const reviewsResult = await reviewsResponse.json();

      const productsResponse = await fetch('/api/products/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: user.id }),
      });
      const productsResult = await productsResponse.json();
      
      if (reviewsResponse.ok) {
        setReviews(reviewsResult.reviews || []);
      } else {
        throw new Error(reviewsResult.error);
      }

      if (productsResponse.ok) {
        setProducts(productsResult.products || []);
      }

    } catch(error: any) {
       toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    } else if (!authLoading && !user) {
      setIsLoading(false);
    }
  }, [user, authLoading, fetchData]);

  useEffect(() => {
    if (isFormOpen) {
      if (selectedReview) {
        form.reset({
          product_id: selectedReview.product_id,
          customer_name: selectedReview.customer_name,
          rating: selectedReview.rating,
          title: selectedReview.title || '',
          review_text: selectedReview.review_text,
          is_approved: selectedReview.is_approved,
        });
      } else {
        form.reset({
          product_id: '',
          customer_name: '',
          rating: 5,
          title: '',
          review_text: '',
          is_approved: true
        });
      }
    }
  }, [isFormOpen, selectedReview, form]);

  const openForm = (review: ProductReview | null) => {
    setSelectedReview(review);
    setIsFormOpen(true);
  };
  
  const handleFormSubmit = async (data: ReviewFormData) => {
    if (!user) return;
    setIsActionLoading(true);

    try {
      const response = await fetch('/api/reviews/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: selectedReview?.id, siteId: user.id }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      toast({ title: `Review ${selectedReview ? 'updated' : 'created'} successfully!` });
      await fetchData();
      setIsFormOpen(false);
    } catch(e: any) {
      toast({ variant: 'destructive', title: 'Failed to save review', description: e.message });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    if (!user) return;
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewId, siteId: user.id }),
      });
      if (response.ok) {
        toast({ title: 'Review approved!' });
        await fetchData();
      } else {
        const result = await response.json();
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to approve review', description: error.message });
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!reviewToDelete || !user) return;
    setIsActionLoading(true);
    try {
      const response = await fetch('/api/reviews/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reviewToDelete.id, siteId: user.id }),
      });
      if (response.ok) {
        toast({ title: 'Review deleted.' });
        await fetchData();
      } else {
        const result = await response.json();
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to delete review', description: error.message });
    } finally {
      setIsActionLoading(false);
      setReviewToDelete(null);
    }
  }

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Review Manager</CardTitle>
                <CardDescription>Approve and manage product reviews from your customers.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </CardContent>
        </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Review Manager</CardTitle>
                <CardDescription>Approve and manage product reviews from your customers.</CardDescription>
            </div>
            <Button onClick={() => openForm(null)}>
              <Plus className="mr-2 h-4 w-4" /> Add Review
            </Button>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No reviews have been submitted yet.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map(review => (
                <Card key={review.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{review.customer_name}</CardTitle>
                            <CardDescription>Product ID: {review.product_id}</CardDescription>
                        </div>
                        <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                            {review.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                    </div>
                     <div className="flex items-center gap-1 mt-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-5 w-5", i < review.rating ? "text-primary fill-primary" : "text-muted-foreground/30")} />
                        ))}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="font-semibold">{review.title}</p>
                    <p className="text-muted-foreground italic">"{review.review_text}"</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'PP')}</p>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openForm(review)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        {!review.is_approved && (
                            <Button variant="ghost" size="icon" onClick={() => handleApprove(review.id)} disabled={isActionLoading}>
                                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setReviewToDelete(review)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{selectedReview ? 'Edit' : 'Create'} Review</DialogTitle>
            <DialogDescription>
              {selectedReview ? 'Update the details for this review.' : 'Manually create a new review for a product.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                <FormField
                    control={form.control}
                    name="product_id"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Product</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField control={form.control} name="customer_name" render={({ field }) => (<FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Rating</FormLabel>
                        <FormControl>
                            <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                    "h-7 w-7 cursor-pointer transition-colors",
                                    field.value >= star
                                        ? "text-primary fill-primary"
                                        : "text-muted-foreground/30"
                                    )}
                                    onClick={() => field.onChange(star)}
                                />
                            ))}
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Review Title (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="review_text" render={({ field }) => (<FormItem><FormLabel>Review Text</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="is_approved" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3"><FormLabel>Approved</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                <DialogFooter>
                    <Button type="submit" disabled={isActionLoading}>
                    {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Review
                    </Button>
                </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!reviewToDelete} onOpenChange={() => setReviewToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the review from "{reviewToDelete?.customer_name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isActionLoading} className={cn(buttonVariants({ variant: "destructive" }))}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
