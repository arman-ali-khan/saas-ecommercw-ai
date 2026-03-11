
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
      <div className="fixed inset-0 bg-black/50 z-[100] sm:hidden" onClick={() => setIsOpen(false)} />
      <div
        className={cn(
          "fixed z-[110] flex flex-col bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300 border-2 border-primary/10",
          "inset-0 rounded-none",
          "sm:inset-auto sm:w-96 sm:h-[550px] sm:max-h-[80vh] sm:bottom-24 sm:right-6 sm:rounded-[2rem]"
        )}
      >
        <div className="p-5 bg-primary text-primary-foreground flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
                <Leaf className="h-5 w-5" />
            </div>
            <h4 className="font-bold text-lg truncate max-w-[180px]">{siteName}</h4>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full h-9 w-9" onClick={fetchChatData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/10 rounded-full h-9 w-9" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="flex-grow bg-muted/5">
          <div className="p-4 pt-6 space-y-6">
            {isLoading ? (
              <ChatSkeleton />
            ) : (
              chatMessages.map((chat, index) => (
                <div
                  key={chat.id ? `db-${chat.id}` : `opt-${index}`}
                  className={cn(
                    'flex items-end gap-2 animate-in fade-in slide-in-from-bottom-1',
                    chat.sender_type === 'customer' ? 'flex-row-reverse' : 'justify-start'
                  )}
                >
                  {chat.sender_type === 'agent' && (
                    <Avatar className="h-8 w-8 border shadow-sm shrink-0">
                      <AvatarFallback className="bg-primary/5 text-primary">
                        <Leaf className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words',
                      chat.sender_type === 'customer'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-background border rounded-tl-none'
                    )}
                  > 
                    {chat.content}
                  </div>
                </div>
              ))
            )}
            <div ref={lastMessageRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t bg-background shrink-0 pb-6 sm:pb-3">
            <div className="relative flex items-center gap-2">
                <Input
                  placeholder="বার্তা লিখুন..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-grow h-11 rounded-2xl border-2 pr-12 focus-visible:ring-primary/20"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="absolute right-1 top-1 h-9 w-9 rounded-xl shadow-lg shadow-primary/20"
                  disabled={isLoading || !message.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
            </div>
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
  const [siteName, setSiteName] = useState('Store');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  const domain = params.username as string;

  useEffect(() => {
    const hasSeenTooltip = localStorage.getItem('chatTooltipSeen');
    if (!hasSeenTooltip) {
      localStorage.setItem('chatTooltipSeen', 'true');
      setIsTooltipOpen(true);
      const timer = setTimeout(() => setIsTooltipOpen(false), 5000);
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

    if (!error) {
       if (data && data.length > 0) {
          setChatMessages(data);
        } else {
          setChatMessages([{
            id: -1,
            conversation_id: conversationId,
            site_id: siteId,
            sender_name: siteName,
            sender_type: 'agent',
            content: `আসসালামু আলাইকুম! ${siteName}-এ আপনাকে স্বাগতম। আমরা আপনাকে কিভাবে সাহায্য করতে পারি?`,
            created_at: new Date().toISOString(),
          }]);
        }
    }
    
    if (isInitialLoad) setIsLoading(false);
  }, [conversationId, siteId, siteName]);


  useEffect(() => {
    async function initializeChat() {
      if (!domain) return;
      const { data } = await supabase.from('profiles').select('id, site_name').eq('domain', domain).maybeSingle();
      if (data) {
        setSiteId(data.id);
        setSiteName(data.site_name || 'Store');
        let convId = localStorage.getItem(`chat_conversation_id_${domain}`);
        if (!convId) {
          convId = uuidv4();
          localStorage.setItem(`chat_conversation_id_${domain}`, convId);
        }
        setConversationId(convId);
      }
    }
    initializeChat();
  }, [domain]);

  useEffect(() => {
    if (_hasHydrated) {
      if (customer) {
        setSenderName(customer.full_name || customer.email || 'User');
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
      .channel(`chat-channel-${conversationId}`)
      .on(
        'postgres_changes',
        { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'live_chat_messages', 
            filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
            const newMessage = payload.new as LiveChatMessage;
            setChatMessages((prev) => {
                // Prevent duplicate if already in state (sent by this client)
                if (prev.find(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
            if (!isOpen && newMessage.sender_type === 'agent') {
                setUnreadCount(prev => prev + 1);
            }
        }
      )
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages, isOpen]);

  if (pathname.includes('/admin') || pathname.startsWith('/dashboard')) {
    return null;
  }

  const handleOpenChat = () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (conversationId) {
        supabase
            .from('live_chat_messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .eq('sender_type', 'agent')
            .eq('is_read', false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId || !siteId) return;

    const content = message.trim();
    setMessage('');

    const { error } = await supabase.from('live_chat_messages').insert({
      conversation_id: conversationId,
      site_id: siteId,
      sender_id: customer?.id || null,
      sender_name: senderName,
      sender_type: 'customer',
      content: content,
      is_read: false
    });

    if (error) console.error('Error sending message:', error);
  };
 
  return (
    <>
      <div className="fixed bottom-28 right-6 z-50">
        <TooltipProvider delayDuration={200}>
            <Tooltip open={isTooltipOpen} onOpenChange={setIsTooltipOpen}>
                <TooltipTrigger asChild>
                    <Button 
                        size="icon" 
                        className="relative rounded-full sm:w-14 w-12 h-12 sm:h-14 shadow-2xl hover:scale-110 active:scale-95 transition-all border-2 border-white/20" 
                        onClick={isOpen ? () => setIsOpen(false) : handleOpenChat}
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
                        {!isOpen && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-destructive-foreground border-2 border-background animate-in zoom-in duration-300">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="font-bold">
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
        fetchChatData={() => fetchChatData(false)}
      />
    </>
  );
}
