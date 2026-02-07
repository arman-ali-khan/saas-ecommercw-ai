'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  Reply,
  Edit,
  Trash2,
  MoreHorizontal,
  X,
  Paperclip,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
  replyingToId?: string;
  edited?: boolean;
  imageUrl?: string;
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
      { id: 'msg3', text: 'খুব ভালো। আমি ১ কেজি অর্ডার করতে চাই। কিভাবে করব?', sender: 'user', timestamp: '10:32 AM', replyingToId: 'msg2' },
      { id: 'msg-img-1', text: 'এই আমের ছবি দেখুন। এটা কি হিমসাগর?', sender: 'user', timestamp: '10:35 AM', imageUrl: 'https://images.unsplash.com/photo-1759162339512-c2e0f23d4dff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxyaXBlJTIwbWFuZ29lc3xlbnwwfHx8fDE3NzA0NjQyNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080' },
      { id: 'msg-img-2', text: 'হ্যাঁ, এটা হিমসাগর আম বলে মনে হচ্ছে। খুব সুন্দর!', sender: 'agent', timestamp: '10:36 AM' },
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
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const isMobileChatView = selectedConversationId && window.innerWidth < 768;
    if (isMobileChatView) {
      document.body.classList.add('chat-view-active');
    } else {
      document.body.classList.remove('chat-view-active');
    }
    return () => {
      document.body.classList.remove('chat-view-active');
    };
  }, [selectedConversationId]);

  useEffect(() => {
    if (scrollViewportRef.current) {
      scrollViewportRef.current.scrollTop = scrollViewportRef.current.scrollHeight;
    }
  }, [selectedConversationId, conversations]);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  const updateConversations = (updatedConvo: Conversation) => {
    setConversations(prev =>
      prev.map(convo =>
        convo.id === updatedConvo.id ? updatedConvo : convo
      )
    );
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage,
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      replyingToId: replyingTo?.id,
    };

    updateConversations({
      ...selectedConversation,
      messages: [...selectedConversation.messages, message]
    });

    setNewMessage('');
    setReplyingTo(null);
  };

  const handleImageSend = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && selectedConversation) {
      const file = event.target.files[0];
      const imageUrl = URL.createObjectURL(file);

      const message: Message = {
        id: `msg-${Date.now()}`,
        text: '',
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        imageUrl,
      };

      updateConversations({
        ...selectedConversation,
        messages: [...selectedConversation.messages, message],
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleStartEdit = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.text);
    setReplyingTo(null);
  };

  const handleSaveEdit = () => {
    if (!editingMessage || !selectedConversation || !newMessage.trim()) return;

    const updatedMessages = selectedConversation.messages.map(m => 
      m.id === editingMessage.id ? { ...m, text: newMessage, edited: true } : m
    );

    updateConversations({
      ...selectedConversation,
      messages: updatedMessages
    });

    setEditingMessage(null);
    setNewMessage('');
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!selectedConversation) return;
    
    // Also remove any replies to this message
    const updatedMessages = selectedConversation.messages.filter(m => m.id !== messageId && m.replyingToId !== messageId);
    updateConversations({ ...selectedConversation, messages: updatedMessages });
  };

  const MessageActions = ({ message }: { message: Message }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                <Reply className="mr-2 h-4 w-4" />
                <span>Reply</span>
            </DropdownMenuItem>
            {message.sender === 'agent' && (
                <>
                    <DropdownMenuItem onClick={() => handleStartEdit(message)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteMessage(message.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                    </DropdownMenuItem>
                </>
            )}
        </DropdownMenuContent>
    </DropdownMenu>
  );

  const MessageBubble = ({ message, conversation }: { message: Message, conversation: Conversation }) => {
    const originalMessage = message.replyingToId
      ? conversation.messages.find(m => m.id === message.replyingToId)
      : null;
    
    return (
        <div className={cn(
            'rounded-lg px-3 py-2 text-sm max-w-full break-words',
            message.sender === 'agent'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}>
            {originalMessage && (
                <div className="mb-2 p-2 rounded-md bg-black/10 border-l-2 border-accent">
                    <p className="font-semibold text-xs opacity-80">
                        {originalMessage.sender === 'agent' ? 'You' : conversation.customerName}
                    </p>
                    <p className="text-xs opacity-70 truncate">{originalMessage.text}</p>
                </div>
            )}
            
            {message.imageUrl && (
              <div 
                className="relative aspect-video w-64 max-w-full rounded-md overflow-hidden my-2 cursor-pointer" 
                onClick={() => setViewingImage(message.imageUrl!)}
              >
                <Image src={message.imageUrl} alt="Attached image" fill className="object-cover" />
              </div>
            )}

            {message.text && <p>{message.text}</p>}

            <p className={cn(
                "text-xs mt-1",
                message.sender === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
            )}>
              {message.edited && <span className="italic">edited ・ </span>}
              {message.timestamp}
            </p>
        </div>
    );
  }

  return (
    <>
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
          <ScrollArea className="flex-1">
            <div className="p-2">
              {conversations.map((convo) => (
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
                    <AvatarImage src={convo.avatar} alt={convo.customerName} />
                    <AvatarFallback>{convo.customerName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow truncate">
                    <p className="font-semibold">{convo.customerName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {convo.messages[convo.messages.length - 1].text || 'Image'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div
          className={cn(
            'flex-grow flex-col',
            selectedConversationId ? 'flex' : 'hidden md:flex'
          )}
        >
          {selectedConversation ? (
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
                  <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.customerName} />
                  <AvatarFallback>{selectedConversation.customerName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedConversation.customerName}</p>
                  <p className="text-xs text-green-500">সক্রিয়</p>
                </div>
              </div>
              <ScrollArea className="flex-grow p-4" viewportRef={scrollViewportRef}>
                <div className="space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div key={message.id} className={cn(
                        'flex items-end gap-2 max-w-[80%] group',
                        message.sender === 'agent' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      )}>
                        {message.sender === 'agent' && <MessageActions message={message} />}
                        {message.sender === 'user' && (
                        <Avatar className="h-8 w-8 self-end">
                          <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.customerName} />
                          <AvatarFallback>{selectedConversation.customerName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        )}
                      <MessageBubble message={message} conversation={selectedConversation} />
                      {message.sender === 'user' && <MessageActions message={message} />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-2 border-t bg-background">
                  {(replyingTo || editingMessage) && (
                      <div className="px-2 pb-2 text-sm">
                          <div className="flex justify-between items-center bg-muted p-2 rounded-md">
                              {replyingTo && (
                                  <div>
                                      <p className="font-semibold text-muted-foreground">Replying to {replyingTo.sender === 'agent' ? 'yourself' : selectedConversation?.customerName}</p>
                                      <p className="text-muted-foreground truncate">{replyingTo.text}</p>
                                  </div>
                              )}
                              {editingMessage && (
                                  <div>
                                      <p className="font-semibold text-muted-foreground">Editing message</p>
                                  </div>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => { setReplyingTo(null); handleCancelEdit(); }}>
                                  <X className="h-4 w-4" />
                              </Button>
                          </div>
                      </div>
                  )}
                  <div className="flex items-end gap-2">
                      <input type="file" ref={fileInputRef} onChange={handleImageSend} accept="image/*" className="hidden" />
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => fileInputRef.current?.click()}>
                          <Paperclip className="h-5 w-5" />
                          <span className="sr-only">Attach image</span>
                      </Button>
                      <div className="relative flex-grow">
                          <Textarea
                          placeholder={editingMessage ? "Edit message..." : "আপনার উত্তর লিখুন..."}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (!newMessage.trim()) return;
                                  editingMessage ? handleSaveEdit() : handleSendMessage();
                              }
                          }}
                          className="pr-12 min-h-[40px] max-h-[150px] resize-none"
                          rows={1}
                          />
                          <Button
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={editingMessage ? handleSaveEdit : handleSendMessage}
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
      <Dialog open={!!viewingImage} onOpenChange={(open) => !open && setViewingImage(null)}>
        <DialogContent className="max-w-4xl w-auto p-0 bg-transparent border-0 shadow-none">
          {viewingImage && (
              <Image
                src={viewingImage}
                alt="Image Preview"
                width={1920}
                height={1080}
                className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
              />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
