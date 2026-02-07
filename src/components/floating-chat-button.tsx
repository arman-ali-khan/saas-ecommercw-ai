'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FloatingChatButton() {
  const pathname = usePathname();
  const [message, setMessage] = useState('');
  const { toast } = useToast();

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
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" className="rounded-full w-14 h-14 shadow-lg">
            <MessageSquare className="h-6 w-6" />
            <span className="sr-only">Open Chat</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" sideOffset={16} className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2 text-center">
              <h4 className="font-medium leading-none">Chat with us</h4>
              <p className="text-sm text-muted-foreground">
                Have a question? We're here to help!
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="chat-message" className="sr-only">
                Your message
              </Label>
              <Textarea
                id="chat-message"
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
              <Button onClick={handleSendMessage} className="w-full">
                Send Message <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
