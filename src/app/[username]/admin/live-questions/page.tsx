'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { bn } from 'date-fns/locale';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, ArrowLeft, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveChatMessage } from '@/types';

type ConversationSummary = {
  id: string;
  customerName: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
};

export default function LiveQuestionsAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [messagesByConversation, setMessagesByConversation] = useState<Map<string, LiveChatMessage[]>>(new Map());
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const scrollViewportRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('site_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
      const grouped = new Map<string, LiveChatMessage[]>();
      for (const message of data) {
        const conversation = grouped.get(message.conversation_id) || [];
        conversation.push(message);
        grouped.set(message.conversation_id, conversation);
      }
      setMessagesByConversation(grouped);
    }
    setIsLoading(false);
  }, [user]);

  // Initial fetch and real-time subscription
  useEffect(() => {
    if (!authLoading && user) {
      fetchMessages();

      const channel = supabase
        .channel(`admin-live-chat-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'live_chat_messages',
            filter: `site_id=eq.${user.id}`,
          },
          (payload) => {
            const newMessage = payload.new as LiveChatMessage;
            setMessagesByConversation(prevMap => {
                const newMap = new Map(prevMap);
                const conversation = newMap.get(newMessage.conversation_id) || [];
                // Avoid adding duplicates
                if (!conversation.find(m => m.id === newMessage.id)) {
                    newMap.set(newMessage.conversation_id, [...conversation, newMessage]);
                }
                return newMap;
            });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, user, fetchMessages]);

  // Scroll to bottom when a conversation is selected or a new message arrives
  useEffect(() => {
    if (selectedConversationId) {
      scrollViewportRef.current?.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [selectedConversationId, messagesByConversation]);

  const conversationSummaries: ConversationSummary[] = useMemo(() => {
    const summaries: ConversationSummary[] = [];
    for (const [id, messages] of messagesByConversation.entries()) {
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const firstCustomerMsg = messages.find(m => m.sender_type === 'customer');
        
        summaries.push({
          id,
          customerName: firstCustomerMsg?.sender_name || 'Unknown',
          lastMessage: lastMsg.content || '',
          lastMessageAt: new Date(lastMsg.created_at!),
          unreadCount: messages.filter(m => !m.is_read && m.sender_type === 'customer').length,
        });
      }
    }
    // Sort by most recent message
    return summaries.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }, [messagesByConversation]);

  const selectedConversationMessages = useMemo(() => {
    return messagesByConversation.get(selectedConversationId || '') || [];
  }, [selectedConversationId, messagesByConversation]);

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) return format(date, 'p', { locale: bn });
    if (isYesterday(date)) return 'গতকাল';
    return format(date, 'PP', { locale: bn });
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !user) return;

    const optimisticMessage: LiveChatMessage = {
        conversation_id: selectedConversationId,
        site_id: user.id,
        sender_id: user.id,
        sender_name: user.fullName,
        sender_type: 'agent',
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        is_read: true,
    };
    
    // Optimistic update
    setMessagesByConversation(prevMap => {
        const newMap = new Map(prevMap);
        const conversation = newMap.get(selectedConversationId) || [];
        newMap.set(selectedConversationId, [...conversation, optimisticMessage]);
        return newMap;
    });

    setNewMessage('');

    const { error } = await supabase.from('live_chat_messages').insert({
        conversation_id: selectedConversationId,
        site_id: user.id,
        sender_id: user.id,
        sender_name: user.fullName,
        sender_type: 'agent',
        content: newMessage.trim(),
    });

    if (error) {
        console.error("Failed to send message:", error);
        // Here you could implement logic to show a "failed" state on the message
    }
  };

  return (
    <Card className="h-[calc(100vh-5rem)] flex flex-col md:flex-row overflow-hidden">
        <div
            className={cn(
            'w-full flex-col md:w-1/3 lg:w-1/4 border-b md:border-b-0 md:border-r',
            selectedConversationId ? 'hidden md:flex' : 'flex'
            )}
        >
            <div className="p-4 border-b">
            <CardTitle>কথোপকথন</CardTitle>
            <CardDescription>সরাসরি গ্রাহকদের উত্তর দিন</CardDescription>
            </div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ScrollArea className="flex-1">
                    <div className="p-2">
                    {conversationSummaries.length > 0 ? (
                        conversationSummaries.map((convo) => (
                            <button
                            key={convo.id}
                            onClick={() => setSelectedConversationId(convo.id)}
                            className={cn(
                                'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors',
                                selectedConversationId === convo.id && 'md:bg-muted',
                                'hover:bg-muted/50'
                            )}
                            >
                            <Avatar>
                                <AvatarFallback>
                                    {convo.customerName.charAt(0) || <User className="h-5 w-5"/>}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow truncate">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{convo.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{formatTimestamp(convo.lastMessageAt)}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground truncate">{convo.lastMessage}</p>
                                    {convo.unreadCount > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shrink-0">{convo.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>কোনো কথোপকথন নেই।</p>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            )}
        </div>

        <div
            className={cn(
            'flex-grow flex-col',
            selectedConversationId ? 'flex' : 'hidden md:flex'
            )}
        >
            {selectedConversationId ? (
            <>
                <div className="p-4 border-b flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-2"
                    onClick={() => setSelectedConversationId(null)}
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <Avatar>
                    <AvatarFallback>{conversationSummaries.find(c => c.id === selectedConversationId)?.customerName.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{conversationSummaries.find(c => c.id === selectedConversationId)?.customerName}</p>
                </div>
                </div>
                <ScrollArea className="flex-grow p-4" viewportRef={scrollViewportRef}>
                <div className="space-y-4">
                    {selectedConversationMessages.map((message, index) => (
                        <div key={message.id ? `db-${message.id}` : `optimistic-${index}`} className={cn(
                            'flex items-end gap-2 max-w-[80%] group',
                            message.sender_type === 'agent' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}>
                            {message.sender_type === 'customer' && (
                                <Avatar className="h-8 w-8 self-end">
                                    <AvatarFallback>{message.sender_name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                'rounded-lg px-3 py-2 text-sm max-w-full break-words',
                                message.sender_type === 'agent'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}>
                                <p>{message.content}</p>
                                <p className={cn(
                                    "text-xs mt-1",
                                    message.sender_type === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                                )}>
                                    {format(new Date(message.created_at!), 'p', { locale: bn })}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                </ScrollArea>
                
                <div className="p-2 border-t bg-background">
                    <div className="flex items-end gap-2">
                        <div className="relative flex-grow">
                            <Textarea
                            placeholder="আপনার উত্তর লিখুন..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (!newMessage.trim()) return;
                                    handleSendMessage();
                                }
                            }}
                            className="pr-12 min-h-[40px] max-h-[150px] resize-none"
                            rows={1}
                            />
                            <Button
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            >
                            <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

            </>
            ) : (
            <div className="hidden md:flex flex-grow flex-col items-center justify-center text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mb-4" />
                <h3 className="text-xl font-semibold">কথোপকথন নির্বাচন করুন</h3>
                <p>একটি কথোপকথন নির্বাচন করে বার্তা দেখা শুরু করুন।</p>
            </div>
            )}
        </div>
    </Card>
  );
}
