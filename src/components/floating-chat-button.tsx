'use client';

import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function FloatingChatButton() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="icon"
        className="rounded-full w-14 h-14 shadow-lg"
        onClick={() => alert('Chat functionality coming soon!')}
      >
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Open Chat</span>
      </Button>
    </div>
  );
}
