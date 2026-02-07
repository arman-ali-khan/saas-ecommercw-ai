'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FloatingChatButton() {
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  if (pathname.startsWith('/admin')) {
    return null;
  }

  const handleSendMessage = () => {
    if (message.trim() === '') return;

    // In a real app, this would send the message to a backend service.
    console.log('Sending message to admin:', message);
    toast({
      title: 'Message Sent!',
      description: "We've received your message and will get back to you soon.",
    });
    setMessage('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button size="icon" className="rounded-full w-14 h-14 shadow-lg">
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <MessageSquare className="h-6 w-6" />
            )}
            <span className="sr-only">Open Chat</span>
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
              <h4 className="font-bold text-lg">Chat with Bangla Naturals</h4>
              <p className="text-sm text-primary-foreground/90">
                We typically reply within a few minutes.
              </p>
            </div>
            <div className="flex-grow p-4 bg-background overflow-y-auto">
              {/* This is where chat history would be rendered */}
              <div className="flex justify-center items-center h-full">
                <p className="text-muted-foreground text-center px-4">
                  Hello! How can we help you today? Ask us anything about our
                  products or your order.
                </p>
              </div>
            </div>
            <div className="p-2 border-t bg-background">
              <div className="flex items-center gap-2">
                <Input
                  id="chat-message"
                  placeholder="Type your message..."
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
                  aria-label="Send Message"
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
