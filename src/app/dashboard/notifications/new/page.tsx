
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

const notificationSchema = z.object({
  recipientIds: z.array(z.string()).min(1, 'Please select at least one recipient.'),
  message: z.string().min(1, 'Message cannot be empty.'),
  link: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function NewNotificationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      recipientIds: [],
      message: '',
      link: '',
    },
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      setIsLoadingAdmins(true);
      try {
        const response = await fetch('/api/saas/admins/list');
        const result = await response.json();
        if (response.ok) {
          setAdmins(result.users || []);
        } else {
          throw new Error(result.error || 'Failed to fetch admins');
        }
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Error', description: error.message });
      } finally {
        setIsLoadingAdmins(false);
      }
    };
    fetchAdmins();
  }, [toast]);

  const filteredAdmins = admins.filter(admin => 
    (admin.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (admin.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (admin.site_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = async (values: NotificationFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/notifications/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Notifications sent to selected admins.' });
        router.push('/dashboard/notifications');
      } else {
        const result = await response.json();
        throw new Error(result.error || 'Failed to send notifications');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAll = () => {
    const currentIds = form.getValues('recipientIds');
    if (currentIds.length === filteredAdmins.length && filteredAdmins.length > 0) {
      form.setValue('recipientIds', []);
    } else {
      form.setValue('recipientIds', filteredAdmins.map(a => a.id));
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="-ml-4">
        <Link href="/dashboard/notifications"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Notifications</Link>
      </Button>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Send Announcement</CardTitle>
          <CardDescription>Select one or more site administrators to notify.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <FormLabel className="text-base">Recipients</FormLabel>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search admins or sites..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between px-2">
                    <Button type="button" variant="link" size="sm" onClick={toggleAll} className="h-auto p-0" disabled={isLoadingAdmins || filteredAdmins.length === 0}>
                      {form.watch('recipientIds').length === filteredAdmins.length && filteredAdmins.length > 0 ? 'Deselect All' : 'Select All Filtered'}
                    </Button>
                    <span className="text-xs text-muted-foreground">{form.watch('recipientIds').length} selected</span>
                  </div>

                  <Card className="border-2">
                    <ScrollArea className="h-72">
                      <div className="p-4 space-y-4">
                        {isLoadingAdmins ? (
                          <div className="flex flex-col gap-4">
                             {[...Array(5)].map((_, i) => <div key={i} className="flex gap-2 items-center"><Loader2 className="animate-spin h-4 w-4" /><div className="h-4 w-32 bg-muted rounded animate-pulse" /></div>)}
                          </div>
                        ) : filteredAdmins.length > 0 ? (
                          filteredAdmins.map((admin) => (
                            <FormField
                              key={admin.id}
                              control={form.control}
                              name="recipientIds"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(admin.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, admin.id])
                                          : field.onChange(field.value?.filter((value) => value !== admin.id))
                                      }}
                                    />
                                  </FormControl>
                                  <div className="grid gap-0.5 leading-none">
                                    <FormLabel className="font-semibold cursor-pointer">{admin.full_name || 'Unnamed Admin'}</FormLabel>
                                    <p className="text-xs text-muted-foreground">{admin.site_name || 'No Site Name'} ({admin.domain || 'no-domain'})</p>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground py-8">No admins found.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                  <FormMessage>{form.formState.errors.recipientIds?.message}</FormMessage>
                </div>

                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Type your notification message here..." {...field} rows={6} />
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
                        <FormLabel>Action Link (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., /admin/settings" {...field} />
                        </FormControl>
                        <FormDescription>Relative path within the admin dashboard.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4">
                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || isLoadingAdmins || form.watch('recipientIds').length === 0}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Users className="mr-2 h-4 w-4" /> Send Announcement
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
