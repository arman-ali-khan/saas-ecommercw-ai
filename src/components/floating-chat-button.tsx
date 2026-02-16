
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import type { LiveChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Leaf, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ChatSkeleton = () => (
    <div className="p-4 space-y-4">
        <div className="flex items-end gap-2 justify-start">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-16 w-3/4" />
        </div>
        <div className="flex items-end gap-2 justify-end">
             <Skeleton className="h-10 w-1/2" />
        </div>
        <div className="flex items-end gap-2 justify-start">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-10 w-2/3" />
        </div>
    </div>
);

const ChatWindow = ({
  isOpen,
  setIsOpen,
  siteName,
  isLoading,
  chatMessages,
  lastMessageRef,
  message,
  setMessage,
  handleSendMessage,
  fetchChatData,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  siteName: string;
  isLoading: boolean;
  chatMessages: LiveChatMessage[];
  lastMessageRef: React.RefObject<HTMLDivElement>;
  message: string;
  setMessage: (message: string) => void;
  handleSendMessage: () => void;
  fetchChatData: () => void;
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setIsOpen(false)} />
      <div
        className={cn(
          "fixed z-50 flex flex-col bg-background shadow-2xl overflow-hidden",
          "inset-0 rounded-none",
          "sm:inset-auto sm:w-96 sm:h-auto sm:max-h-[70vh] sm:bottom-24 sm:right-6 sm:rounded-lg"
        )}
      >
        <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between">
          <h4 className="font-bold text-lg">{siteName}-এর সাথে চ্যাট করুন</h4>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground sm:hidden" onClick={fetchChatData}>
              <RefreshCw className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground" onClick={() => setIsOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-grow bg-background">
          {isLoading ? (
            <ChatSkeleton />
          ) : (
            <div className="p-4 space-y-4">
              {chatMessages.map((chat, index) => (
                <div
                  key={chat.id ? `db-${chat.id}` : `optimistic-${index}`}
                  ref={index === chatMessages.length - 1 ? lastMessageRef : null}
                  className={cn(
                    'flex items-end gap-2',
                    chat.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {chat.sender_type === 'agent' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary-foreground border">
                        <Leaf className="h-5 w-5 text-accent" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2 text-xs sm:text-sm shadow-sm break-words',
                      chat.sender_type === 'customer'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  > 
                    {chat.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-background flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hidden sm:inline-flex" onClick={fetchChatData}>
                <RefreshCw className="h-5 w-5" />
            </Button>
            <Input
              id="chat-message"
              placeholder="আপনার বার্তা টাইপ করুন..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-grow"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="shrink-0"
              aria-label="বার্তা পাঠান"
              disabled={isLoading || !message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </>
  );
};


export default function FloatingChatButton() {
  const pathname = usePathname();
  const params = useParams();
  const { customer, _hasHydrated } = useCustomerAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [senderName, setSenderName] = useState('অতিথি');
  const [isLoading, setIsLoading] = useState(true);
  const [siteName, setSiteName] = useState('Your Store');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const domain = params.username as string;

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('chatTooltipSeen');
    if (!hasSeenTooltip) {
      localStorage.setItem('chatTooltipSeen', 'true');
      setIsTooltipOpen(true);
      const timer = setTimeout(() => {
        setIsTooltipOpen(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchChatData = useCallback(async (isInitialLoad = false) => {
    if (!conversationId || !siteId) return;
    if (isInitialLoad) setIsLoading(true);

    const { data, error } = await supabase
      .from('live_chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
    } else {
       if (data && data.length > 0) {
          setChatMessages(data);
        } else {
          setChatMessages([{
            id: -1,
            conversation_id: conversationId,
            site_id: siteId,
            sender_name: siteName,
            sender_type: 'agent',
            content: `আসসালামু আলাইকুম! আজ আমরা আপনাকে ${siteName}-এ কিভাবে সাহায্য করতে পারি? আমাদের পণ্য বা আপনার অর্ডার সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।`,
            created_at: new Date().toISOString(),
          }]);
        }
    }
    
    if (isInitialLoad) setIsLoading(false);
  }, [conversationId, siteId, siteName]);


  useEffect(() => {
    async function initializeChat() {
      if (!domain) return;
      const { data, error } = await supabase.from('profiles').select('id, site_name').eq('domain', domain).single();
      if (data) {
        setSiteId(data.id);
        setSiteName(data.site_name || 'Your Store');
        let convId = localStorage.getItem(`chat_conversation_id_${domain}`);
        if (!convId) {
          convId = uuidv4();
          localStorage.setItem(`chat_conversation_id_${domain}`, convId);
        }
        setConversationId(convId);
      } else {
        console.error("Could not find site for domain:", domain, error);
      }
    }
    initializeChat();
  }, [domain]);

  useEffect(() => {
    if (_hasHydrated) {
      if (customer) {
        setSenderName(customer.full_name || customer.email || 'Registered User');
      } else {
        let guestName = localStorage.getItem('chat_guest_name');
        if (!guestName) {
            guestName = `অতিথি-${Math.floor(1000 + Math.random() * 9000)}`;
            localStorage.setItem('chat_guest_name', guestName);
        }
        setSenderName(guestName);
      }
    }
  }, [_hasHydrated, customer]);


  useEffect(() => {
    if (conversationId && siteId) {
      fetchChatData(true);
    }
  }, [conversationId, siteId, fetchChatData]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`live-chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `conversation_id=eq.${conversationId}`},
        (payload) => {
            const newMessage = payload.new as LiveChatMessage;
            setChatMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages, isOpen]);

  if (pathname.includes('/admin')) {
    return null;
  }

  const markAgentMessagesAsRead = async () => {
    if (!conversationId) return;
    setUnreadCount(0);
    await supabase
        .from('live_chat_messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('sender_type', 'agent')
        .eq('is_read', false);
  };
  
  const handleOpenChat = () => {
    setIsOpen(true);
    markAgentMessagesAsRead();
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || !siteId) return;

    const newMessage: LiveChatMessage = {
      conversation_id: conversationId,
      site_id: siteId,
      sender_id: customer?.id || null,
      sender_name: senderName,
      sender_type: 'customer',
      content: message.trim(),
    };

    setChatMessages((prev) => [...prev, newMessage]);
    setMessage('');

    const { error } = await supabase.from('live_chat_messages').insert(newMessage);
    if (error) {
        console.error('Error sending message:', error);
    }
    await markAgentMessagesAsRead();
  };
 
  return (
    <>
      <div className="fixed bottom-28 right-6 z-50">
        <TooltipProvider delayDuration={200}>
            <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                <TooltipTrigger asChild>
                    <Button size="icon" className="relative rounded-full sm:w-14 w-10 h-10 sm:h-14 shadow-lg" onClick={isOpen ? () => setIsOpen(false) : handleOpenChat}>
                        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                        <span className="sr-only">চ্যাট খুলুন</span>
                        {!isOpen && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-bold text-destructive-foreground">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>আমাদের প্রশ্ন করুন</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </div>
      <ChatWindow
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        siteName={siteName}
        isLoading={isLoading}
        chatMessages={chatMessages}
        lastMessageRef={lastMessageRef}
        message={message}
        setMessage={setMessage}
        handleSendMessage={handleSendMessage}
        fetchChatData={() => fetchChatData()}
      />
    </>
  );
}
