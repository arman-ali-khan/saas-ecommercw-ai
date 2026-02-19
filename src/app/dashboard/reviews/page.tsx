'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Trash2, Star, AlertTriangle, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { SaaSReview } from '@/types';

export default function SaasReviewsPage() {
  const [reviews, setReviews] = useState<SaaSReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<SaaSReview | null>(null);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/saas/fetch-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity: 'reviews' }),
        });
        const result = await response.json();
        if (response.ok) {
            setReviews(result.data as SaaSReview[]);
        } else {
            throw new Error(result.error || 'Failed to fetch reviews');
        }
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error fetching reviews', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (reviewId: string) => {
    setIsActionLoading(true);
    try {
        const response = await fetch('/api/saas/reviews/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: reviewId, is_approved: true }),
        });
        if (response.ok) {
            toast({ title: 'Review approved!' });
            await fetchReviews();
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to approve');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsActionLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!reviewToDelete) return;
    setIsActionLoading(true);
    try {
        const response = await fetch('/api/saas/reviews/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: reviewToDelete.id }),
        });
        if (response.ok) {
            toast({ title: 'Review deleted.' });
            await fetchReviews();
        } else {
            const result = await response.json();
            throw new Error(result.error || 'Failed to delete');
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsActionLoading(false);
        setReviewToDelete(null);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Manager</CardTitle>
          <CardDescription>Approve and manage user-submitted reviews for the landing page.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Testimonial Manager</CardTitle>
          <CardDescription>Approve and manage user-submitted reviews for the landing page.</CardDescription>
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
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-base">{review.name}</CardTitle>
                                <CardDescription className="text-xs">{review.company}</CardDescription>
                            </div>
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
                    <p className="text-muted-foreground italic text-sm">"{review.review_text}"</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center border-t pt-4">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{format(new Date(review.created_at), 'PP')}</p>
                    <div className="flex gap-2">
                        {!review.is_approved && (
                            <Button size="sm" onClick={() => handleApprove(review.id)} disabled={isActionLoading} className="h-8 text-xs">
                                {isActionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                                <span className="ml-1.5">Approve</span>
                            </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => setReviewToDelete(review)} className="h-8 text-xs">
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Delete Confirmation Modal */}
      {reviewToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isActionLoading && setReviewToDelete(null)} />
            <div className="relative w-full max-w-md bg-background rounded-xl shadow-2xl border p-6 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center gap-3 mb-4 text-destructive">
                    <div className="p-2 bg-destructive/10 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                    <h3 className="text-xl font-bold text-foreground">Delete Testimonial?</h3>
                </div>
                <div className="mb-8"><p className="text-muted-foreground leading-relaxed">This will permanently delete the review from "{reviewToDelete?.name}". This action cannot be undone and the review will be removed from the public website.</p></div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                    <Button variant="outline" onClick={() => setReviewToDelete(null)} disabled={isActionLoading}>Cancel</Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={isActionLoading}>
                        {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete Review
                    </Button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
