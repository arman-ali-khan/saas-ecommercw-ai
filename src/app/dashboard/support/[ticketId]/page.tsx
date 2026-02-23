'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuth } from '@/stores/auth';
import { useSaasStore } from '@/stores/useSaasStore';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Image as ImageIcon, X, CheckCircle2, ShieldAlert, Store, User, Mail, ShieldCheck, ArrowRight, Maximize2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import ImageUploader from '@/components/image-uploader';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { SupportTicket, SupportMessage } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle as VisuallyHiddenTitle } from '@/components/ui/dialog';

export default function SaasTicketDetailPage() {
  const { ticketId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [image, setImage] = useState('');
  const [isSending, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTicketDetails = useCallback(async (isSilent = false) => {
    if (!ticketId) return;
    if (!isSilent) setIsLoading(true);
    
    try {
      const response = await fetch('/api/support/tickets/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });
      const result = await response.json();
      if (response.ok) {
        setTicket(result.ticket);
        setMessages(result.messages || []);
      } else {
        throw new Error(result.error);
      }
    } catch (e: any) {
      if (!isSilent) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
        router.push('/dashboard/support');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [ticketId, router, toast]);

  useEffect(() => {
    fetchTicketDetails();

    const channel = supabase
      .channel(`support-chat-${ticketId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${ticketId}` },
        () => {
          fetchTicketDetails(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, fetchTicketDetails]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !image) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          saasAdminId: user?.id,
          message: newMessage.trim(),
          image_url: image || null,
          role: 'saas_admin'
        }),
      });
      if (response.ok) {
        setNewMessage('');
        setImage('');
        await fetchTicketDetails(true);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
        const response = await fetch('/api/saas/support/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId, status }),
        });
        if (response.ok) {
            toast({ title: 'Status updated' });
            await fetchTicketDetails(true);
        }
    } catch (e) {
        console.error(e);
    }
  };

  if (isLoading && !ticket) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  if (!ticket) return null;

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
      <div className="lg:col-span-2 flex flex-col space-y-4">
        <div className="flex items-center justify-between shrink-0">
            <Button variant="ghost" asChild className="-ml-4">
                <Link href="/dashboard/support"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Tickets</Link>
            </Button>
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <Card className="flex-grow flex flex-col overflow-hidden border-2 rounded-2xl">
            <CardHeader className="border-b p-4 sm:p-6 shrink-0">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <CardTitle className="text-xl sm:text-2xl">{ticket.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px]">{ticket.priority.toUpperCase()}</Badge>
                            <span>#{ticket.id.slice(0,8)}</span>
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <ScrollArea className="flex-grow p-4 sm:p-6 bg-muted/5" viewportRef={scrollRef}>
                <div className="space-y-6">
                    {/* Initial Issue */}
                    <div className="flex justify-start gap-3">
                        <Avatar className="h-8 w-8"><AvatarFallback>A</AvatarFallback></Avatar>
                        <div className="space-y-3 max-w-[85%]">
                            <div className="bg-card p-4 rounded-2xl rounded-tl-none shadow-sm border">
                                <p className="text-sm leading-relaxed">{ticket.description}</p>
                                {ticket.image_url && (
                                    <div 
                                      className="mt-4 relative aspect-video max-w-sm rounded-xl overflow-hidden border bg-muted cursor-zoom-in group/img"
                                      onClick={() => setPreviewImage(ticket.image_url!)}
                                    >
                                        <Image src={ticket.image_url} alt="Initial Screenshot" fill className="object-cover transition-transform group-hover/img:scale-105" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                          <Maximize2 className="text-white h-6 w-6" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex gap-3", msg.sender_role === 'saas_admin' ? "justify-end" : "justify-start")}>
                            {msg.sender_role === 'admin' && <Avatar className="h-8 w-8"><AvatarFallback>A</AvatarFallback></Avatar>}
                            <div className={cn("space-y-1 max-w-[85%]", msg.sender_role === 'saas_admin' ? "items-end" : "items-start")}>
                                <div className={cn(
                                    "p-4 rounded-2xl shadow-sm text-sm border",
                                    msg.sender_role === 'saas_admin' ? "bg-primary text-primary-foreground border-primary/20 rounded-tr-none" : "bg-card rounded-tl-none"
                                )}>
                                    <p className="leading-relaxed">{msg.message}</p>
                                    {msg.image_url && (
                                        <div 
                                          className="mt-3 relative aspect-video w-64 max-w-full rounded-xl overflow-hidden border bg-background/10 cursor-zoom-in group/img"
                                          onClick={() => setPreviewImage(msg.image_url!)}
                                        >
                                            <Image src={msg.image_url} alt="Attachment" fill className="object-cover transition-transform group-hover/img:scale-105" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                              <Maximize2 className="text-white h-5 w-5" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-muted-foreground px-1">{format(new Date(msg.created_at), 'p')}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card shrink-0">
                <div className="space-y-4">
                    {image && (
                        <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg animate-in zoom-in-95">
                            <Image src={image} alt="Upload preview" fill className="object-cover" />
                            <button className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5" onClick={() => setImage('')}><X className="h-3 w-3" /></button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <Input 
                                placeholder="Write a response..." 
                                value={newMessage} 
                                onChange={e => setNewMessage(e.target.value)} 
                                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                                className="h-12 pr-12 rounded-xl"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <ImageUploader onUpload={(res) => setImage(res.info.secure_url)} label="" />
                            </div>
                        </div>
                        <Button size="icon" className="h-12 w-12 rounded-xl" onClick={handleSendMessage} disabled={isSending || (!newMessage.trim() && !image)}>
                          {isSending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-2 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Store Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Store className="h-5 w-5 text-primary" /></div>
                    <div>
                        <p className="font-bold text-sm">{ticket.profiles?.site_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Site Name</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg"><User className="h-5 w-5 text-muted-foreground" /></div>
                    <div>
                        <p className="font-bold text-sm">{ticket.profiles?.full_name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Administrator</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg"><Mail className="h-5 w-5 text-muted-foreground" /></div>
                    <div>
                        <p className="font-bold text-sm truncate max-w-[180px]">{ticket.profiles?.email}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Contact Email</p>
                    </div>
                </div>
                <Separator />
                <Button variant="outline" className="w-full" asChild>
                    <Link href={`/dashboard/users/${ticket.site_id}`}>View Full Profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid gap-2">
                <Button variant="secondary" className="justify-start gap-3 h-11" onClick={() => handleStatusChange('resolved')} disabled={ticket.status === 'resolved'}>
                    <CheckCircle2 className="h-4 w-4" /> Mark as Resolved
                </Button>
                <Button variant="ghost" className="justify-start gap-3 h-11 text-destructive hover:bg-destructive/5" onClick={() => handleStatusChange('closed')} disabled={ticket.status === 'closed'}>
                    <ShieldAlert className="h-4 w-4" /> Close Ticket
                </Button>
            </CardContent>
        </Card>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden border-none bg-transparent shadow-none flex items-center justify-center">
          <VisuallyHiddenTitle className="sr-only">Image Preview</VisuallyHiddenTitle>
          <div className="relative w-full h-[90vh] flex items-center justify-center">
            {previewImage && (
              <Image 
                src={previewImage} 
                alt="Fullscreen Preview" 
                width={1200} 
                height={800} 
                className="object-contain max-w-full max-h-full rounded-lg shadow-2xl"
              />
            )}
            <Button 
              variant="secondary" 
              size="icon" 
              className="absolute top-4 right-4 rounded-full bg-background/80 backdrop-blur-sm"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}