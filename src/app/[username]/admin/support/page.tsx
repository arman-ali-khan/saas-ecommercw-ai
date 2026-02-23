'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { useAdminStore } from '@/stores/useAdminStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, MessageSquare, Clock, CheckCircle2, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ImageUploader from '@/components/image-uploader';
import Image from 'next/image';
import type { SupportTicket } from '@/types';

const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(20, 'Please describe your issue in detail.'),
  image_url: z.string().url().optional().or(z.literal('')),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function SupportForumPage() {
  const { user } = useAuth();
  const { supportTickets: tickets, setSupportTickets: setTickets } = useAdminStore();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(() => {
    const store = useAdminStore.getState();
    return store.supportTickets.length === 0;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: '', description: '', image_url: '', priority: 'normal' },
  });

  const fetchTickets = useCallback(async (force = false) => {
    if (!user) return;
    
    const store = useAdminStore.getState();
    const isFresh = Date.now() - store.lastFetched.supportTickets < 300000;
    
    if (!force && store.supportTickets.length > 0 && isFresh) {
        setIsLoading(false);
        return;
    }

    if (store.supportTickets.length === 0 || force) {
        setIsLoading(true);
    }

    try {
      const response = await fetch('/api/support/tickets/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: user.id }),
      });
      const result = await response.json();
      if (response.ok) {
        setTickets(result.tickets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user, setTickets]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onSubmit = async (values: TicketFormData) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, siteId: user.id }),
      });
      if (response.ok) {
        toast({ title: 'টিকেট তৈরি হয়েছে', description: 'আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।' });
        setIsFormOpen(false);
        form.reset();
        await fetchTickets(true);
      } else {
        const res = await response.json();
        throw new Error(res.error);
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Open</Badge>;
      case 'in_progress': return <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">In Progress</Badge>;
      case 'resolved': return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Resolved</Badge>;
      case 'closed': return <Badge variant="outline">Closed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">সাপোর্ট ফোরাম</h1>
          <p className="text-muted-foreground">আপনার ওয়েবসাইটের যেকোনো সমস্যায় আমাদের সাহায্য নিন।</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="rounded-full shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> নতুন সমস্যা তৈরি করুন
        </Button>
      </div>

      <div className="grid gap-6">
        {isLoading && tickets.length === 0 ? (
          <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>
        ) : tickets.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>বিষয়</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>অগ্রাধিকার</TableHead>
                    <TableHead>তৈরি হয়েছে</TableHead>
                    <TableHead className="text-right">অ্যাকশন</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="group">
                      <TableCell className="font-medium">
                        <Link href={`/admin/support/${ticket.id}`} className="hover:text-primary transition-colors block py-1">
                          {ticket.title}
                        </Link>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">{ticket.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(ticket.created_at), 'PPP', { locale: bn })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/support/${ticket.id}`}>
                            <MessageSquare className="mr-2 h-4 w-4" /> চ্যাট দেখুন
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center py-24 bg-muted/20 border-2 border-dashed rounded-[2rem]">
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">আপনার কোনো ওপেন টিকেট নেই</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">যদি আপনার ওয়েবসাইটে কোনো সমস্যা হয়ে থাকে, তবে একটি নতুন টিকেট খুলুন। আমাদের টিম দ্রুত সমাধান করবে।</p>
            <Button onClick={() => setIsFormOpen(true)} variant="outline" className="rounded-full px-8">নতুন টিকেট খুলুন</Button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isSubmitting && setIsFormOpen(false)} />
          <div className="relative w-full max-w-xl bg-background rounded-[2rem] shadow-2xl border-2 border-primary/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold flex items-center gap-2"><Plus className="h-6 w-6 text-primary" /> নতুন সমস্যা জানান</h2>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}><X className="h-5 w-5" /></Button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>সমস্যার শিরোনাম</FormLabel>
                        <FormControl><Input placeholder="সংক্ষেপে আপনার সমস্যাটি লিখুন" {...field} className="h-12 rounded-xl" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>বিস্তারিত বিবরণ</FormLabel>
                        <FormControl><Textarea placeholder="আপনার সমস্যাটি বিস্তারিতভাবে লিখুন যাতে আমরা সহজে বুঝতে পারি।" rows={5} {...field} className="rounded-xl resize-none" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>স্ক্রিনশট (ঐচ্ছিক)</FormLabel>
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border-2 border-dashed bg-muted/30">
                          {field.value ? (
                            <div className="relative h-24 w-24 rounded-lg overflow-hidden border shadow-sm shrink-0">
                              <Image src={field.value} alt="Screenshot" fill className="object-cover" />
                              <button type="button" className="absolute top-1 right-1 bg-background/80 rounded-full p-1" onClick={() => form.setValue('image_url', '')}><X className="h-3 w-3" /></button>
                            </div>
                          ) : (
                            <div className="h-24 w-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground shrink-0"><ImageIcon className="h-8 w-8 opacity-20" /></div>
                          )}
                          <div className="flex-grow space-y-2">
                            <ImageUploader onUpload={(res) => form.setValue('image_url', res.info.secure_url, { shouldValidate: true })} label="স্ক্রিনশট আপলোড করুন" />
                            <p className="text-[10px] text-muted-foreground italic">সমস্যার স্ক্রিনশট দিলে সমাধান দ্রুত হবে।</p>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-4 flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>বাতিল</Button>
                    <Button type="submit" className="flex-1 h-12 rounded-xl shadow-lg shadow-primary/20" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> পাঠানো হচ্ছে...</> : 'টিকেট সাবমিট করুন'}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}