
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Loader2, Trash2, CheckCircle, Star, Plus, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 9;

export default function ReviewsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Pick<Product, 'id' | 'name'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
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
  };

  const totalPages = Math.ceil(reviews.length / ITEMS_PER_PAGE);
  const paginatedReviews = useMemo(() => {
    return reviews.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [reviews, currentPage]);

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
              {paginatedReviews.map(review => (
                <Card key={review.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>{review.customer_name}</CardTitle>
                            <CardDescription className="truncate max-w-[150px]">Product ID: {review.product_id}</CardDescription>
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
        {totalPages > 1 && (
            <CardFooter className="flex justify-center gap-4 py-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    আগেরটি
                </Button>
                <div className="text-sm font-medium">পৃষ্ঠা {currentPage} / {totalPages}</div>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    পরবর্তী
                </Button>
            </CardFooter>
        )}
      </Card>
      
      {/* Custom Raw Tailwind Dialog (Bottom Sheet on Mobile) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={() => setIsFormOpen(false)}
            />
            
            {/* Dialog Content */}
            <div className="relative w-full max-w-2xl bg-background rounded-t-[2rem] sm:rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-bold">{selectedReview ? 'Edit Review' : 'Create Review'}</h2>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" onClick={() => setIsFormOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="product_id"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-11">
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
                            
                            <FormField control={form.control} name="customer_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Customer Name</FormLabel>
                                    <FormControl><Input placeholder="e.g., John Doe" {...field} className="h-11" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
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
                                                "h-8 w-8 cursor-pointer transition-colors",
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
                            
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Review Title (Optional)</FormLabel>
                                    <FormControl><Input placeholder="e.g., Amazing Quality!" {...field} className="h-11" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="review_text" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Review Text</FormLabel>
                                    <FormControl><Textarea placeholder="Share details about the experience..." {...field} rows={4} className="resize-none" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="is_approved" render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-xl border p-4 bg-muted/30">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Approve Review</FormLabel>
                                        <p className="text-xs text-muted-foreground">Check this to make it visible on the product page.</p>
                                    </div>
                                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                </FormItem>
                            )} />
                            
                            <div className="pt-4 flex gap-3 pb-8 sm:pb-0">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    className="flex-1 h-12 rounded-xl"
                                    onClick={() => setIsFormOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isActionLoading} 
                                    className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20"
                                >
                                    {isActionLoading ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                                    ) : (
                                        'Save Review'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </div>
      )}
      
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
