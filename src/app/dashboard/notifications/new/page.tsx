'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { User } from '@/types';

const notificationSchema = z.object({
  recipientId: z.string({ required_error: 'Please select a recipient.' }),
  message: z.string().min(1, 'Message cannot be empty.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function NewNotificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin');

      if (error) {
        toast({ variant: 'destructive', title: 'Error fetching admins', description: error.message });
      } else {
        setAdmins(data as User[]);
      }
      setIsLoading(false);
    };
    fetchAdmins();
  }, [toast]);

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      message: '',
      link: '',
    },
  });

  const onSubmit = async (values: NotificationFormData) => {
    setIsSubmitting(true);
    const selectedAdmin = admins.find(admin => admin.id === values.recipientId);
    if (!selectedAdmin) {
      toast({ variant: 'destructive', title: 'Invalid admin selected' });
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('notifications').insert({
      recipient_id: values.recipientId,
      recipient_type: 'admin',
      site_id: selectedAdmin.id, // For admins, site_id is same as their user_id
      message: values.message,
      link: values.link || null,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Failed to send notification', description: error.message });
    } else {
      toast({ title: 'Notification sent successfully!' });
      router.push('/dashboard/notifications');
    }
    setIsSubmitting(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Notification</CardTitle>
        <CardDescription>Send a custom notification to a site administrator.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="recipientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an admin to notify..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoading ? (
                        <div className="p-2">Loading admins...</div>
                      ) : (
                        admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.fullName} (@{admin.username})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>The site admin who will receive this notification.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Your subscription is expiring soon..." {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., /dashboard/billing" {...field} />
                  </FormControl>
                   <FormDescription>A relative URL the user will be taken to when they click the notification.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Notification
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
