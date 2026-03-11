'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/lib/supabase/client';
import { format, isToday, isYesterday } from 'date-fns';
import { bn } from 'date-fns/locale';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send, ArrowLeft, Loader2, User, RefreshCw } from 'lucide-react';
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
  const userId = user?.id;
  const [messagesByConversation, setMessagesByConversation] = useState<Map<string, LiveChatMessage[]>>(new Map());
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = useCallback(() => {
    if (scrollViewportRef.current) {
      const scrollContainer = scrollViewportRef.current;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const fetchAndGroupMessages = useCallback(async (isInitialLoad: boolean) => {
    if (!userId) return;
    if (isInitialLoad) setIsLoading(true);
    
    try {
        const response = await fetch('/api/chat/messages/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ siteId: userId }),
        });
        const result = await response.json();

        if (response.ok) {
            const data = result.messages || [];
            const grouped = new Map<string, LiveChatMessage[]>();
            for (const msg of data) {
                const conversation = grouped.get(msg.conversation_id) || [];
                conversation.push(msg);
                grouped.set(msg.conversation_id, conversation);
            }
            setMessagesByConversation(grouped);
        } else {
            throw new Error(result.error);
        }
    } catch (err) {
        console.error("Error fetching chat messages via API:", err);
    } finally {
        if (isInitialLoad) setIsLoading(false);
    }
  }, [userId]);


  useEffect(() => {
    if (authLoading || !userId) return;
    
    fetchAndGroupMessages(true);

    const channelName = `admin-chat-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `site_id=eq.${userId}`,
        },
        (payload) => {
            const msg = payload.new as LiveChatMessage;
            setMessagesByConversation(prevMap => {
                const newMap = new Map(prevMap);
                const conversation = [...(newMap.get(msg.conversation_id) || [])];
                
                if (!conversation.find(m => m.id === msg.id)) {
                    conversation.push(msg);
                    newMap.set(msg.conversation_id, conversation);
                }
                return newMap;
            });
        }
      )
      .subscribe();
        
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authLoading, userId, fetchAndGroupMessages]);


  // Effect to scroll to bottom when messages update or conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedConversationId, messagesByConversation, scrollToBottom]);

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    setMessagesByConversation(prevMap => {
        const newMap = new Map(prevMap);
        const conversation = newMap.get(conversationId);
        if (conversation) {
            const updatedConversation = conversation.map(msg => 
                msg.sender_type === 'customer' ? { ...msg, is_read: true } : msg
            );
            newMap.set(conversationId, updatedConversation);
        }
        return newMap;
    });

    await supabase
        .from('live_chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'customer')
        .eq('is_read', false);
  }, []);

  const conversationSummaries: ConversationSummary[] = useMemo(() => {
    const summaries: ConversationSummary[] = [];
    for (const [id, messages] of messagesByConversation.entries()) {
      if (messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        const firstCustomerMsg = messages.find(m => m.sender_type === 'customer');
        
        summaries.push({
          id,
          customerName: firstCustomerMsg?.sender_name || 'Anonymous',
          lastMessage: lastMsg.content || '',
          lastMessageAt: new Date(lastMsg.created_at || Date.now()),
          unreadCount: messages.filter(m => !m.is_read && m.sender_type === 'customer').length,
        });
      }
    }
    return summaries.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }, [messagesByConversation]);

  const selectedConversationMessages = useMemo(() => {
    return messagesByConversation.get(selectedConversationId || '') || [];
  }, [selectedConversationId, messagesByConversation]);

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) return format(date, 'p', { locale: bn });
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'PP', { locale: bn });
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Insert to DB
    const { error } = await supabase.from('live_chat_messages').insert({
        conversation_id: selectedConversationId,
        site_id: user.id,
        sender_id: user.id,
        sender_name: user.fullName,
        sender_type: 'agent',
        content: content,
        is_read: true
    });

    if (error) {
        console.error("Error sending chat message:", error);
    }

    // Mark current customer messages as read in DB
    await supabase
        .from('live_chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', selectedConversationId)
        .eq('sender_type', 'customer')
        .eq('is_read', false);
  };

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col md:flex-row overflow-hidden border-2 shadow-sm rounded-2xl">
        <div
            className={cn(
            'w-full flex-col md:w-1/3 lg:w-1/4 border-b md:border-b-0 md:border-r bg-muted/10',
            selectedConversationId ? 'hidden md:flex' : 'flex'
            )}
        >
            <div className="p-4 border-b bg-muted/20">
                <CardTitle className="text-lg">কনভারসেশন</CardTitle>
                <CardDescription className="text-xs">কাস্টমারদের সরাসরি রিপ্লাই দিন</CardDescription>
            </div>
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                    {conversationSummaries.length > 0 ? (
                        conversationSummaries.map((convo) => (
                            <button
                            key={convo.id}
                            onClick={() => handleSelectConversation(convo.id)}
                            className={cn(
                                'w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all',
                                selectedConversationId === convo.id ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'
                            )}
                            >
                            <Avatar className="h-10 w-10 border">
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                    {convo.customerName.charAt(0) || <User className="h-5 w-5"/>}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <p className={cn("font-bold text-sm truncate", convo.unreadCount > 0 ? "text-foreground" : "text-foreground/80")}>{convo.customerName}</p>
                                    <p className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">{formatTimestamp(convo.lastMessageAt)}</p>
                                </div>
                                <div className="flex justify-between items-center gap-2">
                                    <p className={cn("text-xs truncate", convo.unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground")}>{convo.lastMessage}</p>
                                    {convo.unreadCount > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shrink-0 shadow-lg shadow-primary/20">{convo.unreadCount}</span>
                                    )}
                                </div>
                            </div>
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-20 text-muted-foreground px-4">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-medium">কোনো কনভারসেশন নেই।</p>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            )}
        </div>

        <div
            className={cn(
            'flex-grow flex flex-col bg-background',
            selectedConversationId ? 'flex' : 'hidden md:flex'
            )}
        >
            {selectedConversationId ? (
            <>
                <div className="p-4 border-b flex items-center justify-between bg-muted/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden rounded-full h-9 w-9" onClick={() => setSelectedConversationId(null)}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-10 w-10 border shadow-sm">
                            <AvatarFallback className="bg-primary/5 text-primary font-black">
                                {conversationSummaries.find(c => c.id === selectedConversationId)?.customerName.charAt(0) || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-sm leading-tight">{conversationSummaries.find(c => c.id === selectedConversationId)?.customerName}</p>
                            <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> অ্যাক্টিভ চ্যাট
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => fetchAndGroupMessages(false)} className="text-muted-foreground rounded-full h-9 w-9">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
                
                <ScrollArea className="flex-grow p-4 sm:p-6" viewportRef={scrollViewportRef}>
                    <div className="space-y-6 pb-4">
                        {selectedConversationMessages.map((message, index) => (
                            <div key={message.id ? `db-${message.id}` : `temp-${index}`} className={cn(
                                'flex items-end gap-2 max-w-[85%] group animate-in fade-in slide-in-from-bottom-2 duration-300',
                                message.sender_type === 'agent' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                            )}>
                                {message.sender_type === 'customer' && (
                                    <Avatar className="h-8 w-8 self-end border shadow-sm shrink-0">
                                        <AvatarFallback className="bg-muted text-[10px] font-bold">{message.sender_name.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                )}
                                <div className="space-y-1">
                                    <div className={cn(
                                        'rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words',
                                        message.sender_type === 'agent' 
                                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                            : 'bg-muted/50 border border-border/50 rounded-tl-none'
                                    )}>
                                        {message.content}
                                    </div>
                                    <p className={cn(
                                        "text-[9px] uppercase font-bold tracking-widest px-1 opacity-50", 
                                        message.sender_type === 'agent' ? 'text-right' : 'text-left'
                                    )}>
                                        {message.created_at ? format(new Date(message.created_at), 'p', { locale: bn }) : 'Just now'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-muted/5 shrink-0">
                    <div className="relative max-w-4xl mx-auto flex items-end gap-2">
                        <div className="relative flex-grow">
                            <Textarea
                                placeholder="আপনার রিপ্লাই লিখুন..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                className="pr-12 min-h-[50px] max-h-[150px] resize-none rounded-2xl border-2 focus-visible:ring-primary/20 shadow-inner"
                                rows={1}
                            />
                            <Button 
                                size="icon" 
                                className="absolute right-2 bottom-2 h-9 w-9 rounded-xl shadow-lg shadow-primary/20" 
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
            <div className="hidden md:flex flex-grow flex-col items-center justify-center text-center text-muted-foreground p-8">
                <div className="bg-primary/5 p-10 rounded-full mb-6">
                    <MessageSquare className="h-16 w-16 text-primary/30" />
                </div>
                <h3 className="text-xl font-bold text-foreground">কনভারসেশন সিলেক্ট করুন</h3>
                <p className="max-w-xs mx-auto mt-2">বাম পাশের তালিকা থেকে একটি কনভারসেশন সিলেক্ট করে মেসেজ দেখা শুরু করুন।</p>
            </div>
            )}
        </div>
    </Card>
  );
}
