
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Image as ImageIcon, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import ImageUploader from '@/components/image-uploader';
import type { SupportTicket, SupportMessage } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function TicketDetailPage() {
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
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchTicketDetails = useCallback(async (isSilent = false) => {
    if (!ticketId || !user) return;
    if (!isSilent) setIsLoading(true);
    
    try {
      const response = await fetch('/api/support/tickets/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, siteId: user.id }),
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
        router.push('/admin/support');
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [ticketId, user, router, toast]);

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
          siteId: user?.id,
          message: newMessage.trim(),
          image_url: image || null,
          role: 'admin'
        }),
      });
      if (response.ok) {
        setNewMessage('');
        setImage('');
        await fetchTicketDetails(true);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-20"><Loader2 className="animate-spin h-10 w-10 text-muted-foreground" /></div>;
  }

  if (!ticket) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between shrink-0">
        <Button variant="ghost" asChild className="-ml-4">
          <Link href="/admin/support"><ArrowLeft className="mr-2 h-4 w-4" /> পিছে ফিরে যান</Link>
        </Button>
        <Badge variant={ticket.status === 'resolved' ? 'default' : 'secondary'}>{ticket.status.replace('_', ' ').toUpperCase()}</Badge>
      </div>

      <Card className="shrink-0 border-2">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">{ticket.title}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">তৈরি হয়েছে: {format(new Date(ticket.created_at), 'PPPp', { locale: bn })}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="flex-grow flex flex-col overflow-hidden border-2 rounded-[2rem]">
        <ScrollArea className="flex-grow p-4 sm:p-6" viewportRef={scrollRef}>
          <div className="space-y-6">
            {/* Initial Problem Post */}
            <div className="flex justify-start gap-3">
              <Avatar className="h-8 w-8 shrink-0"><AvatarFallback>A</AvatarFallback></Avatar>
              <div className="space-y-3 max-w-[85%]">
                <div className="bg-muted p-4 rounded-2xl rounded-tl-none shadow-sm">
                  <p className="text-sm leading-relaxed">{ticket.description}</p>
                  {ticket.image_url && (
                    <div className="mt-4 relative aspect-video rounded-xl overflow-hidden border">
                      <Image src={ticket.image_url} alt="Initial Screenshot" fill className="object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.sender_role === 'admin' ? "justify-end" : "justify-start")}>
                {msg.sender_role === 'saas_admin' && <Avatar className="h-8 w-8 shrink-0"><AvatarFallback>S</AvatarFallback></Avatar>}
                <div className={cn("space-y-1 max-w-[85%]", msg.sender_role === 'admin' ? "items-end" : "items-start")}>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm text-sm",
                    msg.sender_role === 'admin' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"
                  )}>
                    <p className="leading-relaxed">{msg.message}</p>
                    {msg.image_url && (
                      <div className="mt-3 relative aspect-video rounded-xl overflow-hidden border bg-background/10">
                        <Image src={msg.image_url} alt="Attachment" fill className="object-cover" />
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground px-1">{format(new Date(msg.created_at), 'p', { locale: bn })}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/10 shrink-0">
          {ticket.status === 'closed' || ticket.status === 'resolved' ? (
            <div className="text-center p-4 bg-background/50 rounded-xl border border-dashed text-muted-foreground text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" /> এই টিকেটটি বন্ধ করা হয়েছে।
            </div>
          ) : (
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
                    placeholder="আপনার উত্তর লিখুন..." 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                    className="h-12 pr-12 rounded-xl border-2"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <ImageUploader onUpload={(res) => setImage(res.info.secure_url)} label="" />
                  </div>
                </div>
                <Button size="icon" className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20" onClick={handleSendMessage} disabled={isSending || (!newMessage.trim() && !image)}>
                  {isSending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
