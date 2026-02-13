
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Loader2, Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const reviewSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  company: z.string().optional(),
  review_text: z.string().min(20, 'Review must be at least 20 characters.'),
  rating: z.number().min(1, 'Please select a rating.').max(5),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export default function LeaveReviewPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: '',
      company: '',
      review_text: '',
      rating: 0,
    },
  });

  const onSubmit = async (values: ReviewFormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.from('saas_reviews').insert(values);
    setIsSubmitting(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message,
      });
    } else {
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                <CardTitle className="mt-4">Thank You!</CardTitle>
                <CardDescription>Your review has been submitted for approval.</CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>
          Share your experience with our platform to help others.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={cn(
                                "h-8 w-8 cursor-pointer transition-colors",
                                field.value >= star ? "text-primary fill-primary" : "text-muted-foreground/30"
                            )}
                            onClick={() => field.onChange(star)}
                        />
                    ))}
                    </div>
                     <FormMessage />
                </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="review_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tell us what you think..." {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
