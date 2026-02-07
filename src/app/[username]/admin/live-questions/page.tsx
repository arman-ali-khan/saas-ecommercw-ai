'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageSquare, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
};

type Conversation = {
  id: string;
  customerName: string;
  avatar: string;
  messages: Message[];
};

// Mock data for demonstration
const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    customerName: 'আরিফুল ইসলাম',
    avatar: 'https://github.com/shadcn.png',
    messages: [
      { id: 'msg1', text: 'নমস্কার, এই সুন্দরবনের মধু কি আসল?', sender: 'user', timestamp: '10:30 AM' },
      { id: 'msg2', text: 'জি, আমাদের সকল মধু সরাসরি সুন্দরবন থেকে সংগ্রহ করা এবং ১০০% খাঁটি।', sender: 'agent', timestamp: '10:31 AM' },
      { id: 'msg3', text: 'খুব ভালো। আমি ১ কেজি অর্ডার করতে চাই। কিভাবে করব?', sender: 'user', timestamp: '10:32 AM' },
    ],
  },
  {
    id: 'conv2',
    customerName: 'সুমাইয়া খাতুন',
    avatar: 'https://picsum.photos/seed/customer2/40/40',
    messages: [
      { id: 'msg4', text: 'আমার অর্ডার #ORD002 এর স্ট্যাটাস কি?', sender: 'user', timestamp: '9:15 AM' },
       { id: 'msg5', text: 'আমি চেক করছি। অনুগ্রহ করে এক মুহূর্ত অপেক্ষা করুন।', sender: 'agent', timestamp: '9:16 AM' },
    ],
  },
  {
    id: 'conv3',
    customerName: 'রাশেদ আহমেদ',
    avatar: 'https://picsum.photos/seed/customer3/40/40',
    messages: [
      { id: 'msg6', text: 'আপনার দোকানে কি কি খেজুর পাওয়া যায়?', sender: 'user', timestamp: 'গতকাল' },
    ],
  },
];


export default function LiveQuestionsAdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(conversations[0]?.id || null);
  const [newMessage, setNewMessage] = useState('');

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev => 
      prev.map(convo => 
        convo.id === selectedConversationId 
          ? { ...convo, messages: [...convo.messages, message] }
          : convo
      )
    );
    setNewMessage('');
  };


  return (
    <Card className="h-[calc(100vh-5rem)] flex flex-col md:flex-row">
      {/* Conversation List */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-b md:border-b-0 md:border-r">
        <div className="p-4 border-b">
           <CardTitle>কথোপকথন</CardTitle>
           <CardDescription>সরাসরি গ্রাহকদের উত্তর দিন</CardDescription>
        </div>
        <ScrollArea className="h-[20vh] md:h-full">
          <div className="p-2">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConversationId(convo.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors',
                  selectedConversationId === convo.id
                    ? 'bg-muted'
                    : 'hover:bg-muted/50'
                )}
              >
                <Avatar>
                  <AvatarImage src={convo.avatar} alt={convo.customerName} />
                  <AvatarFallback>{convo.customerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow truncate">
                  <p className="font-semibold">{convo.customerName}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {convo.messages[convo.messages.length - 1].text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat View */}
      <div className="flex-grow flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.customerName} />
                <AvatarFallback>{selectedConversation.customerName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedConversation.customerName}</p>
                <p className="text-xs text-green-500">সক্রিয়</p>
              </div>
            </div>
            <ScrollArea className="flex-grow p-4">
              <div className="space-y-4">
                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-end gap-2 max-w-[80%]',
                      message.sender === 'agent' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    {message.sender === 'user' && (
                       <Avatar className="h-8 w-8">
                         <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.customerName} />
                         <AvatarFallback>{selectedConversation.customerName.charAt(0)}</AvatarFallback>
                       </Avatar>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-3 py-2 text-sm',
                        message.sender === 'agent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p>{message.text}</p>
                      <p className={cn(
                          "text-xs mt-1",
                           message.sender === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                        )}>{message.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
              <div className="relative">
                <Input
                  placeholder="আপনার উত্তর লিখুন..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="pr-12"
                />
                <Button
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <h3 className="text-xl font-semibold">কথোপকথন নির্বাচন করুন</h3>
            <p>একটি কথোপকথন নির্বাচন করে বার্তা দেখা শুরু করুন।</p>
          </div>
        )}
      </div>
    </Card>
  );
}
