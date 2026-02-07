'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
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

type ChatMessage = {
  id: number;
  text: string;
  sender: 'user' | 'bot';
};

export default function FloatingChatButton() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('chat-messages');
      if (storedMessages) {
        setChatMessages(JSON.parse(storedMessages));
      } else {
        // Set initial welcome message if no history
        setChatMessages([
          {
            id: 1,
            text: 'নমস্কার! আজ আমরা আপনাকে কিভাবে সাহায্য করতে পারি? আমাদের পণ্য বা আপনার অর্ডার সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।',
            sender: 'bot',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to parse chat messages from localStorage', error);
      // Set initial welcome message on error
      setChatMessages([
        {
          id: 1,
          text: 'নমস্কার! আজ আমরা আপনাকে কিভাবে সাহায্য করতে পারি? আমাদের পণ্য বা আপনার অর্ডার সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন।',
          sender: 'bot',
        },
      ]);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    // We only save when there are messages to prevent overwriting with empty array on first load
    if (chatMessages.length > 0) {
      try {
        localStorage.setItem('chat-messages', JSON.stringify(chatMessages));
      } catch (error) {
        console.error('Failed to save chat messages to localStorage', error);
      }
    }
  }, [chatMessages]);

  // Scroll to bottom when new messages are added
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

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: Date.now() + 1,
        text: 'যোগাযোগ করার জন্য ধন্যবাদ! একজন এজেন্ট শীঘ্রই আপনার সাথে থাকবেন।',
        sender: 'bot',
      };
      setChatMessages((prev) => [...prev, botResponse]);
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
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
              <h4 className="font-bold text-lg">বাংলা ন্যাচারালস-এর সাথে চ্যাট করুন</h4>
              <p className="text-sm text-primary-foreground/90">
                আমরা সাধারণত কয়েক মিনিটের মধ্যে উত্তর দিই।
              </p>
            </div>
            <ScrollArea className="flex-grow bg-background">
              <div className="p-4 space-y-4">
                {chatMessages.map((chat, index) => (
                  <div
                    key={chat.id}
                    ref={index === chatMessages.length - 1 ? lastMessageRef : null}
                    className={cn(
                      'flex items-end gap-2',
                      chat.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {chat.sender === 'bot' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary-foreground border">
                          <Leaf className="h-5 w-5 text-accent" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg px-3 py-2 text-sm shadow-sm',
                        chat.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {chat.text}
                    </div>
                  </div>
                ))}
              </div>
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
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="shrink-0"
                  aria-label="বার্তা পাঠান"
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
