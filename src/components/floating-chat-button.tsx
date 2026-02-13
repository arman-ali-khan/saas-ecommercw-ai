
'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase/client';
import { useCustomerAuth } from '@/stores/useCustomerAuth';
import type { LiveChatMessage } from '@/types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X, Leaf } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from './ui/skeleton';

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
  const [siteName, setSiteName] = useState('Your Store'); // Added state for site name

  const lastMessageRef = useRef<HTMLDivElement>(null);

  const domain = params.username as string;

  // 1. Initialize siteId and conversationId
  useEffect(() => {
    async function initializeChat() {
      setIsLoading(true);
      if (!domain) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, site_name') // Fetch site_name
        .eq('domain', domain)
        .single();
      
      if (data) {
        setSiteId(data.id);
        setSiteName(data.site_name || 'Your Store'); // Set the site name
        let convId = localStorage.getItem(`chat_conversation_id_${domain}`);
        if (!convId) {
          convId = uuidv4();
          localStorage.setItem(`chat_conversation_id_${domain}`, convId);
        }
        setConversationId(convId);
      } else {
        console.error("Could not find site for domain:", domain, error);
        setIsLoading(false);
      }
    }
    initializeChat();
  }, [domain]);

  // 2. Set sender name based on auth state
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


  // 3. Fetch initial messages once we have IDs
  useEffect(() => {
    if (conversationId && siteId) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from('live_chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
        } else if (data && data.length > 0) {
          setChatMessages(data);
        } else {
          // If no messages, add initial bot message
          setChatMessages([{
            id: -1, // Dummy ID for initial message
            conversation_id: conversationId,
            site_id: siteId,
            sender_name: siteName, // Use dynamic site name
            sender_type: 'agent',
            content: `আসসালামু আলাইকুম! আজ আমরা আপনাকে ${siteName}-এ কিভাবে সাহায্য করতে পারি? আমাদের পণ্য বা আপনার অর্ডার সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।`,
            created_at: new Date().toISOString(),
          }]);
        }
        setIsLoading(false);
      };
      fetchMessages();
    }
  }, [conversationId, siteId, siteName]); // Added siteName dependency

  // 4. Subscribe to real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`live-chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as LiveChatMessage;
          // Only add messages from the agent via real-time to prevent duplication
          // of the customer's own optimistically-rendered messages.
          if (newMessage.sender_type === 'agent') {
            setChatMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);


  // 5. Scroll to bottom on new message
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

    // Optimistically update UI
    setChatMessages((prev) => [...prev, newMessage]);
    setMessage('');

    const { error } = await supabase.from('live_chat_messages').insert(newMessage);
    if (error) {
        console.error('Error sending message:', error);
        // TODO: Add error handling to UI, maybe show a "failed to send" state
    }
  };

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
  )

  return (
    <div className="fixed bottom-28 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" className="rounded-full w-14 h-14 shadow-lg">
            {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
            <span className="sr-only">চ্যাট খুলুন</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="end"
          sideOffset={16}
          className="w-80 sm:w-96 rounded-lg shadow-2xl p-0 overflow-hidden"
        >
          <div className="flex flex-col h-[50vh] max-h-[450px]">
            <div className="p-4 bg-primary text-primary-foreground">
              <h4 className="font-bold text-lg">{siteName}-এর সাথে চ্যাট করুন</h4>
              <p className="text-xs sm:text-sm text-primary-foreground/90">
                আমরা সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই।
              </p>
            </div>
            <ScrollArea className="flex-grow bg-background">
                {isLoading ? <ChatSkeleton /> : (
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
            <div className="p-2 border-t bg-background">
              <div className="flex items-center gap-2">
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
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
