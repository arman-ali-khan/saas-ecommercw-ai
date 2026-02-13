
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Trash2, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { SaaSReview } from '@/types';

export default function SaasReviewsPage() {
  const [reviews, setReviews] = useState<SaaSReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<SaaSReview | null>(null);
  const { toast } = useToast();

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('saas_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Error fetching reviews', description: error.message });
    } else {
      setReviews(data as SaaSReview[]);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleApprove = async (reviewId: string) => {
    setIsActionLoading(true);
    const { error } = await supabase.from('saas_reviews').update({ is_approved: true }).eq('id', reviewId);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to approve review', description: error.message });
    } else {
      toast({ title: 'Review approved!' });
      await fetchReviews();
    }
    setIsActionLoading(false);
  };
  
  const handleDelete = async () => {
    if (!reviewToDelete) return;
    setIsActionLoading(true);
    const { error } = await supabase.from('saas_reviews').delete().eq('id', reviewToDelete.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Failed to delete review', description: error.message });
    } else {
      toast({ title: 'Review deleted.' });
      await fetchReviews();
    }
    setIsActionLoading(false);
    setReviewToDelete(null);
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
                                <CardTitle>{review.name}</CardTitle>
                                <CardDescription>{review.company}</CardDescription>
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
                    <p className="text-muted-foreground italic">"{review.review_text}"</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'PP')}</p>
                    <div className="flex gap-2">
                        {!review.is_approved && (
                            <Button size="sm" onClick={() => handleApprove(review.id)} disabled={isActionLoading}>
                                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                <span className="ml-2">Approve</span>
                            </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => setReviewToDelete(review)}>
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

      <AlertDialog open={!!reviewToDelete} onOpenChange={() => setReviewToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the review from "{reviewToDelete?.name}". This action cannot be undone.
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
