
'use client';

import { useEffect, useRef } from 'react';
import { getFCMToken, onMessageListener } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface FCMTokenManagerProps {
  userId: string | null | undefined;
  userType: 'admin' | 'customer';
}

export default function FCMTokenManager({ userId, userType }: FCMTokenManagerProps) {
  const { toast } = useToast();
  const hasRequested = useRef(false);

  useEffect(() => {
    if (!userId || hasRequested.current) return;
    hasRequested.current = true;

    const setupFCM = async () => {
      try {
        const token = await getFCMToken();
        if (token) {
          console.log("FCM Token:", token);
          await fetch('/api/notifications/register-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, userType, token }),
          });
        }
      } catch (error) {
        console.error('Failed to setup FCM:', error);
      }
    };

    setupFCM();

    // Listen for foreground messages
    const setupListener = async () => {
        const payload: any = await onMessageListener();
        if (payload) {
            toast({
                title: payload.notification?.title || 'নতুন আপডেট',
                description: payload.notification?.body,
            });
        }
    };
    
    setupListener();

  }, [userId, userType, toast]);

  return null;
}
